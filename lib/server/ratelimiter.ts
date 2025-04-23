// must not describe 'use server' here to avoid security issues.
import { epochTimeToNaturalLanguage } from '../utils';
import { getRedis } from './redis';
import { getSubscriptionInfo } from './subscription-utils';
import type { SubscriptionInfo } from '@/types';

export type RateLimitResult =
  | {
      allowed: true;
      remaining: number;
      timeRemaining: null;
      subscriptionType?: 'free' | 'premium' | 'team';
    }
  | {
      allowed: false;
      remaining: 0;
      timeRemaining: number;
      subscriptionType?: 'free' | 'premium' | 'team';
    };

/**
 * rate limiting by sliding window algorithm.
 *
 * check if the user is allowed to make a request.
 * if the user is allowed, decrease the remaining count by 1.
 */
export async function ratelimit(
  userId: string,
  model: string,
  subscriptionInfo?: SubscriptionInfo,
): Promise<RateLimitResult> {
  if (!isRateLimiterEnabled()) {
    return { allowed: true, remaining: -1, timeRemaining: null };
  }
  const subInfo = subscriptionInfo || (await getSubscriptionInfo(userId));
  return _ratelimit(model, userId, subInfo);
}

function isRateLimiterEnabled(): boolean {
  return process.env.RATELIMITER_ENABLED?.toLowerCase() !== 'false';
}

export async function _ratelimit(
  model: string,
  userId: string,
  subscriptionInfo: SubscriptionInfo,
): Promise<RateLimitResult> {
  try {
    const storageKey = _makeStorageKey(userId, model);
    const [remaining, timeRemaining] = await getRemaining(
      userId,
      model,
      subscriptionInfo,
    );

    const subscriptionType = subscriptionInfo.isTeam
      ? 'team'
      : subscriptionInfo.isPremium
        ? 'premium'
        : 'free';

    if (remaining === 0) {
      return {
        allowed: false,
        remaining,
        timeRemaining: timeRemaining!,
        subscriptionType,
      };
    }
    await _addRequest(storageKey);
    return {
      allowed: true,
      remaining: remaining - 1,
      timeRemaining: null,
      subscriptionType,
    };
  } catch (error) {
    console.error('Redis rate limiter error:', error);
    return { allowed: false, remaining: 0, timeRemaining: 60000 };
  }
}

export async function getRemaining(
  userId: string,
  model: string,
  subscriptionInfo: SubscriptionInfo,
): Promise<[number, number | null]> {
  const storageKey = _makeStorageKey(userId, model);
  const timeWindow = getTimeWindow();
  const now = Date.now();
  const limit = _getLimit(model, subscriptionInfo);

  const redis = getRedis();
  const [[firstMessageTime], count] = await Promise.all([
    redis.zrange(storageKey, 0, 0, { withScores: true }),
    redis.zcard(storageKey),
  ]);

  if (!firstMessageTime) {
    return [limit, null];
  }

  const windowEndTime = Number(firstMessageTime) + timeWindow;
  if (now >= windowEndTime) {
    // The window has expired, no need to reset the count here
    return [limit, null];
  }

  const remaining = Math.max(0, limit - count);
  return [remaining, remaining === 0 ? windowEndTime - now : null];
}

function getTimeWindow(): number {
  const key = 'RATELIMITER_TIME_WINDOW_MINUTES';
  return Number(process.env[key]) * 60 * 1000;
}

function _getLimit(model: string, subscriptionInfo: SubscriptionInfo): number {
  const isPaid = subscriptionInfo.isPremium || subscriptionInfo.isTeam;
  const suffix = isPaid ? '_PREMIUM' : '_FREE';

  // Standard model handling
  const fixedModelName = _getFixedModelName(model);
  const limitKey = `RATELIMITER_LIMIT_${fixedModelName}${suffix}`;
  const defaultLimit = 0;
  const limit = getValidatedLimit(process.env[limitKey], defaultLimit);

  if (subscriptionInfo.isTeam) {
    const teamMultiplier = Number(process.env.TEAM_LIMIT_MULTIPLIER) || 1.8;
    return Math.floor(limit * teamMultiplier);
  }

  return limit;
}

// Helper function to validate and parse limits
function getValidatedLimit(
  value: string | undefined,
  defaultValue: number,
): number {
  if (value === undefined) return defaultValue;

  const parsedValue = Number(value);
  return !Number.isNaN(parsedValue) && parsedValue >= 0
    ? parsedValue
    : defaultValue;
}

async function _addRequest(key: string) {
  const now = Date.now();
  const timeWindow = getTimeWindow();

  const redis = getRedis();
  try {
    const [firstMessageTime] = await redis.zrange(key, 0, 0, {
      withScores: true,
    });

    if (!firstMessageTime || now - Number(firstMessageTime) >= timeWindow) {
      // Start a new window
      await redis
        .multi()
        .del(key)
        .zadd(key, { score: now, member: now })
        .expire(key, Math.ceil(timeWindow / 1000))
        .exec();
    } else {
      // Add to existing window
      await redis.zadd(key, { score: now, member: now });
    }
  } catch (error) {
    console.error('Redis _addRequest error:', error);
    throw error; // Re-throw to be caught in _ratelimit
  }
}

function _getFixedModelName(model: string): string {
  return (model.startsWith('gpt-4') ? 'gpt-4' : model)
    .replace(/-/g, '_')
    .toUpperCase();
}

function _makeStorageKey(userId: string, model: string): string {
  // For all models, use the model-specific key
  const fixedModelName = _getFixedModelName(model);
  return `ratelimit:${userId}:${fixedModelName}`;
}

export function getRateLimitErrorMessage(
  timeRemaining: number,
  premium: boolean,
  model: string,
): string {
  const remainingText = epochTimeToNaturalLanguage(timeRemaining);

  if (model === 'terminal') {
    const baseMessage = `⚠️ You've reached the limit for terminal usage.\n\nTo ensure fair usage for all users, please wait ${remainingText} before trying again.`;
    return premium
      ? baseMessage
      : `${baseMessage}\n\n🚀 Consider upgrading to Pro or Team for higher terminal usage limits and more features.`;
  }

  let message = `⚠️ You've reached the limit for ${getModelName(model)}.\n\nTo ensure fair usage for all users, please wait ${remainingText} before trying again.`;

  if (premium) {
    if (model === 'pentestgpt') {
      message += `\n\nIn the meantime, you can use Large Model`;
    } else if (model === 'pentestgpt-pro') {
      message += `\n\nIn the meantime, you can use Small Model`;
    }
  } else {
    message += `\n\n🔓 Want more? Upgrade to Pro or Team and unlock a world of features:
- Access to smarter models
- Extended limits on messaging, reasoning, and terminal
- Access to file uploads, vision, web search, and browsing
- Opportunities to test new features`;
  }

  return message.trim();
}

function getModelName(model: string): string {
  const modelNames: { [key: string]: string } = {
    pentestgpt: 'Small Model',
    'pentestgpt-pro': 'Large Model',
    terminal: 'terminal',
    'tts-1': 'text-to-speech',
    'stt-1': 'speech-to-text',
    reasoning: 'reasoning model',
  };
  return modelNames[model] || model;
}

export async function checkRatelimitOnApi(
  userId: string,
  model: string,
  subscriptionInfo?: SubscriptionInfo,
): Promise<{ allowed: boolean; info: any }> {
  const result = await ratelimit(userId, model, subscriptionInfo);
  const subInfo = subscriptionInfo || (await getSubscriptionInfo(userId));
  const max = _getLimit(model, subInfo);
  const used = max - result.remaining;
  const info: any = {
    remaining: result.remaining,
    used,
    max,
    isPremiumUser: subInfo.isPremium,
  };
  if (!result.allowed) {
    info.timeRemaining = result.timeRemaining;
    info.message = getRateLimitErrorMessage(
      result.timeRemaining!,
      subInfo.isPremium,
      model,
    );
  }
  return { allowed: result.allowed, info };
}

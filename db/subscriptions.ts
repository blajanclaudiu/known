import { supabase } from '@/lib/supabase/browser-client';

export async function getSubscriptionByUserId(userId: string) {
  // Development override: Set NEXT_PUBLIC_OVERRIDE_SUBSCRIPTION_TYPE=pro|free in .env
  // to bypass database subscription checks and force a specific subscription type
  const envSubscriptionType =
    process.env.NEXT_PUBLIC_OVERRIDE_SUBSCRIPTION_TYPE?.toLowerCase();
  if (envSubscriptionType === 'pro' || envSubscriptionType === 'free') {
    return {
      id: 'env-override',
      subscription_id: 'sub_env_override',
      user_id: userId,
      customer_id: 'cus_env_override',
      created_at: new Date().toISOString(),
      updated_at: null,
      status: 'active',
      start_date: new Date().toISOString(),
      cancel_at: null,
      canceled_at: null,
      ended_at: null,
      plan_type: envSubscriptionType,
      team_name: null,
      quantity: 1,
      team_id: null,
    };
  }

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');

  // If user has multiple active subscriptions, pick the first one
  const subscription =
    subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

  return subscription;
}

export async function getSubscriptionByTeamId(teamId: string) {
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('team_id', teamId)
    .eq('status', 'active');

  // If team has multiple active subscriptions, pick the first one
  const subscription =
    subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

  return subscription;
}

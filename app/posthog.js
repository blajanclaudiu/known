import { PostHog } from 'posthog-node';
import { isProductionEnvironment } from '@/lib/utils';

export default function PostHogClient() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || !isProductionEnvironment) {
    return null;
  }

  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
  return posthogClient;
}

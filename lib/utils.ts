import type { ChatMessage } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function unixToDateString(unix: number | null): string | null {
  if (unix === null) {
    return null;
  }
  return new Date(unix * 1000).toISOString();
}

// example of results:
// - 20 minutes 4 seconds
// - 1 hour 20 minutes 4 seconds
// - 4 hours 20 minutes 4 seconds
export function epochTimeToNaturalLanguage(input: number): string {
  const seconds = Math.floor(input / 1000);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const timeParts = [];
  if (hours > 0) {
    timeParts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  }
  if (minutes > 0) {
    timeParts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  }
  if (remainingSeconds > 0) {
    timeParts.push(
      `${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`,
    );
  }

  return timeParts.join(' ');
}

export function generateRandomAlphanumeric(length: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export const lastSequenceNumber = (chatMessages: ChatMessage[]) =>
  chatMessages.reduce(
    (max, msg) => Math.max(max, msg.message.sequence_number),
    0,
  );

export const getRelevantSnippet = (
  content: string,
  query: string,
  maxLength = 150,
) => {
  const lowerContent = content.toLowerCase();
  const terms = query.toLowerCase().split(' ');
  const startIndex = terms.reduce((index, term) => {
    const pos = lowerContent.indexOf(term);
    return pos !== -1 && (index === -1 || pos < index) ? pos : index;
  }, -1);

  if (startIndex === -1) return `${content.slice(0, maxLength)}...`;

  const contextStart = Math.max(0, startIndex - 50);
  const contextEnd = Math.min(content.length, contextStart + maxLength);
  return (
    (contextStart > 0 ? '...' : '') +
    content.slice(contextStart, contextEnd) +
    (contextEnd < content.length ? '...' : '')
  );
};

// Add these types if not already defined
export type DateCategory =
  | 'Today'
  | 'Yesterday'
  | 'Previous 7 Days'
  | 'Previous 30 Days'
  | 'Older';

interface DateSortable {
  updated_at: string | null;
  created_at: string;
}

export const getDateBoundaries = () => {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));

  return {
    todayStart,
    yesterdayStart: new Date(new Date().setDate(todayStart.getDate() - 1)),
    weekStart: new Date(new Date().setDate(todayStart.getDate() - 7)),
    monthStart: new Date(new Date().setDate(todayStart.getDate() - 30)),
  };
};

export const sortByDateCategory = <T extends DateSortable>(
  items: T[],
  category: DateCategory,
) => {
  const bounds = getDateBoundaries();

  return items
    .filter((item) => {
      const date = new Date(item.updated_at || item.created_at);
      switch (category) {
        case 'Today':
          return date >= bounds.todayStart;
        case 'Yesterday':
          return date >= bounds.yesterdayStart && date < bounds.todayStart;
        case 'Previous 7 Days':
          return date >= bounds.weekStart && date < bounds.yesterdayStart;
        case 'Previous 30 Days':
          return date >= bounds.monthStart && date < bounds.weekStart;
        case 'Older':
          return date < bounds.monthStart;
      }
    })
    .sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime(),
    );
};

export const isProductionEnvironment = process.env.NODE_ENV === 'production';

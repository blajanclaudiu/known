import type { Tables } from '@/supabase/types';
import type { ChatMessage, LLMID } from '.';

export interface ChatSettings {
  model: LLMID;
}

export interface ChatPayload {
  chatMessages: ChatMessage[];
  retrievedFileItems: Tables<'file_items'>[];
}

export interface ChatAPIPayload {
  chatSettings: ChatSettings;
  messages: Tables<'messages'>[];
}

export interface Message {
  role: Role;
  content: string;
}

export type Role = 'assistant' | 'user' | 'system';

export type SubscriptionStatus = 'free' | 'pro' | 'team';

export type SubscriptionInfo = {
  isPremium: boolean;
  isTeam: boolean;
  status: SubscriptionStatus;
};

export type ChatMetadata = {
  id: string;
  newChat: boolean;
};

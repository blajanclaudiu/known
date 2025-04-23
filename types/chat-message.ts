import type { Tables } from '@/supabase/types';
import type { FilePart } from 'ai';

export interface ChatMessage {
  message: Tables<'messages'>;
  fileItems: Tables<'file_items'>[];
  feedback?: Tables<'feedback'>;
  isFinal?: boolean;
}

export interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

export interface TextContent {
  type: 'text';
  text: string;
}

export type MessageContent = ImageContent | TextContent | FilePart;

export interface BuiltChatMessage {
  role: string;
  content: string | MessageContent[];
}

import type { ProcessedTeamMember } from '@/lib/team-utils';
import type { Tables } from '@/supabase/types';
import type {
  ChatMessage,
  ChatSettings,
  ContentType,
  MessageImage,
  SubscriptionStatus,
} from '@/types';
import type { User } from '@supabase/supabase-js';
import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useContext,
} from 'react';

interface PentestGPTContextType {
  // USER STORE
  user: User | null;

  // PROFILE STORE
  profile: Tables<'profiles'> | null;
  setProfile: Dispatch<SetStateAction<Tables<'profiles'> | null>>;
  fetchStartingData: () => Promise<void>;
  // CONTENT TYPE STORE
  contentType: ContentType;
  setContentType: React.Dispatch<React.SetStateAction<ContentType>>;

  // SUBSCRIPTION STORE
  subscription: Tables<'subscriptions'> | null;
  setSubscription: Dispatch<SetStateAction<Tables<'subscriptions'> | null>>;
  subscriptionStatus: SubscriptionStatus;
  setSubscriptionStatus: Dispatch<SetStateAction<SubscriptionStatus>>;
  updateSubscription: (newSubscription: Tables<'subscriptions'> | null) => void;
  isPremiumSubscription: boolean;
  teamMembers: ProcessedTeamMember[] | null;
  refreshTeamMembers: () => Promise<void>;
  membershipData: ProcessedTeamMember | null;

  // ITEMS STORE
  chats: Tables<'chats'>[];
  setChats: Dispatch<SetStateAction<Tables<'chats'>[]>>;

  // PASSIVE CHAT STORE
  userInput: string;
  setUserInput: Dispatch<SetStateAction<string>>;
  chatMessages: ChatMessage[];
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  chatSettings: ChatSettings | null;
  setChatSettings: Dispatch<SetStateAction<ChatSettings>>;
  selectedChat: Tables<'chats'> | null;
  setSelectedChat: Dispatch<SetStateAction<Tables<'chats'> | null>>;
  temporaryChatMessages: ChatMessage[];
  setTemporaryChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;

  // ACTIVE CHAT STORE
  abortController: AbortController | null;
  setAbortController: Dispatch<SetStateAction<AbortController | null>>;

  // ATTACHMENTS STORE
  chatFiles: Tables<'files'>[];
  setChatFiles: Dispatch<SetStateAction<Tables<'files'>[]>>;
  chatImages: MessageImage[];
  setChatImages: Dispatch<SetStateAction<MessageImage[]>>;
  newMessageFiles: Tables<'files'>[];
  setNewMessageFiles: Dispatch<SetStateAction<Tables<'files'>[]>>;
  newMessageImages: MessageImage[];
  setNewMessageImages: Dispatch<SetStateAction<MessageImage[]>>;

  // RETRIEVAL STORE
  useRetrieval: boolean;
  setUseRetrieval: Dispatch<SetStateAction<boolean>>;
  sourceCount: number;
  setSourceCount: Dispatch<SetStateAction<number>>;

  // Audio
  currentPlayingMessageId: string | null;
  setCurrentPlayingMessageId: Dispatch<SetStateAction<string | null>>;
  isMicSupported: boolean;
  setIsMicSupported: Dispatch<SetStateAction<boolean>>;

  // TEMPORARY CHAT STORE
  isTemporaryChat: boolean;

  // Fetch Chat and Messages
  fetchChat: (chatId: string) => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  loadMoreMessages: (chatId: string) => Promise<void>;

  // Loading Messages States
  isLoadingMore: boolean;
  allMessagesLoaded: boolean;

  // User Email
  userEmail: string;
  setUserEmail: (email: string) => void;
}

export const PentestGPTContext = createContext<PentestGPTContextType>({
  // USER STORE
  user: null,

  // PROFILE STORE
  profile: null,
  setProfile: () => {},
  fetchStartingData: async () => {},
  // CONTENT TYPE STORE
  contentType: 'chats',
  setContentType: () => {},

  // SUBSCRIPTION STORE
  subscription: null,
  setSubscription: () => {},
  subscriptionStatus: 'free',
  setSubscriptionStatus: () => {},
  updateSubscription: () => {},
  isPremiumSubscription: false,
  teamMembers: null,
  refreshTeamMembers: async () => {},
  membershipData: null,

  // ITEMS STORE
  chats: [],
  setChats: () => {},

  // PASSIVE CHAT STORE
  userInput: '',
  setUserInput: () => {},
  selectedChat: null,
  setSelectedChat: () => {},
  chatMessages: [],
  setChatMessages: () => {},
  chatSettings: null,
  setChatSettings: () => {},
  temporaryChatMessages: [],
  setTemporaryChatMessages: () => {},

  // ACTIVE CHAT STORE
  abortController: null,
  setAbortController: () => {},

  // ATTACHMENTS STORE
  chatFiles: [],
  setChatFiles: () => {},
  chatImages: [],
  setChatImages: () => {},
  newMessageFiles: [],
  setNewMessageFiles: () => {},
  newMessageImages: [],
  setNewMessageImages: () => {},

  // RETRIEVAL STORE
  useRetrieval: false,
  setUseRetrieval: () => {},
  sourceCount: 4,
  setSourceCount: () => {},

  // Audio
  currentPlayingMessageId: null,
  setCurrentPlayingMessageId: () => {},
  isMicSupported: false,
  setIsMicSupported: () => {},

  // TEMPORARY CHAT STORE
  isTemporaryChat: false,

  // Loading Messages States
  isLoadingMore: false,
  allMessagesLoaded: false,

  // Fetch Chat and Messages
  fetchChat: async (chatId: string) => {},
  fetchMessages: async (chatId: string) => {},
  loadMoreMessages: async (chatId: string) => {},

  // User Email
  userEmail: '',
  setUserEmail: () => {},
});

export const usePentestGPT = () => useContext(PentestGPTContext);

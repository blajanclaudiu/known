import type { Tables } from '@/supabase/types';
import { getChatFilesByMultipleChatIds } from './chat-files';
import { localDB } from './local/db';
import { getFeedbackByMultipleChatIds } from './message-feedback';
import {
  getFileItemsByMultipleFileIds,
  getMessageFileItemsByMultipleMessageIds,
} from './message-file-items';
import { getMessagesByMultipleChatIds } from './messages';

const LAST_MESSAGE_SYNC = 'lastMessageSync';
const LAST_FEEDBACK_SYNC = 'lastFeedbackSync';
const LAST_FILE_SYNC = 'lastFileSync';

const buildKey = (key: string, chatId: string) => `${key}-${chatId}`;

export const refreshLocalData = async (chats: Tables<'chats'>[]) => {
  const currentSyncDate = new Date().toISOString();

  const resyncMessages = [];
  const resyncFeedback = [];
  const resyncFiles = [];

  for (const chat of chats) {
    const lastMessageSync = await localDB.storage.getSyncData(
      buildKey(LAST_MESSAGE_SYNC, chat.id),
    );

    if (
      !lastMessageSync ||
      new Date(lastMessageSync) < new Date(chat.last_message_update)
    ) {
      resyncMessages.push(chat.id);
    }

    const lastFeedbackSync = await localDB.storage.getSyncData(
      buildKey(LAST_FEEDBACK_SYNC, chat.id),
    );
    if (
      !lastFeedbackSync ||
      new Date(lastFeedbackSync) < new Date(chat.last_feedback_update)
    ) {
      resyncFeedback.push(chat.id);
    }

    const lastFileSync = await localDB.storage.getSyncData(
      buildKey(LAST_FILE_SYNC, chat.id),
    );
    if (
      !lastFileSync ||
      new Date(lastFileSync) < new Date(chat.last_file_update)
    ) {
      resyncFiles.push(chat.id);
    }
  }

  // for messages
  await refreshMessages(resyncMessages, currentSyncDate);

  // for feedback
  await refreshFeedback(resyncFeedback, currentSyncDate);

  // for files
  await refreshFiles(resyncFiles, currentSyncDate);
};

const refreshMessages = async (chatIds: string[], currentSyncDate: string) => {
  const uniqueChatIds = [...new Set(chatIds)];
  const messages = await getMessagesByMultipleChatIds(uniqueChatIds);
  await getMessageFileItemsByMultipleMessageIds(
    messages.map((message) => message.id),
  );
  await localDB.storage.setSyncData(
    uniqueChatIds.map((chatId) => buildKey(LAST_MESSAGE_SYNC, chatId)),
    currentSyncDate,
  );
};

const refreshFeedback = async (chatIds: string[], currentSyncDate: string) => {
  await getFeedbackByMultipleChatIds(chatIds);
  await localDB.storage.setSyncData(
    chatIds.map((chatId) => buildKey(LAST_FEEDBACK_SYNC, chatId)),
    currentSyncDate,
  );
};

const refreshFiles = async (chatIds: string[], currentSyncDate: string) => {
  const uniqueChatIds = [...new Set(chatIds)];
  const files = await getChatFilesByMultipleChatIds(uniqueChatIds);
  await getFileItemsByMultipleFileIds(files.map((file) => file.id));
  await localDB.storage.setSyncData(
    uniqueChatIds.map((chatId) => buildKey(LAST_FILE_SYNC, chatId)),
    currentSyncDate,
  );
};

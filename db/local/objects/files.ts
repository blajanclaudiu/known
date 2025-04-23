import type { Tables } from '@/supabase/types';
import {
  deleteItem,
  getItem,
  getItemsByIndex,
  putItem,
} from '../core/indexedDB';
import { STORES } from '../schema/schema';

const getStoredChatFilesByChatId = async (
  chatId: string,
): Promise<Tables<'files'>[]> => {
  return await getItemsByIndex<Tables<'files'>>(
    STORES.FILES,
    'chat_id',
    chatId,
  );
};

const getStoredFileById = async (
  fileId: string,
): Promise<Tables<'files'> | undefined> => {
  return await getItem<Tables<'files'>>(STORES.FILES, fileId);
};

const getStoredFilesCount = async (userId: string) => {
  const files = await getItemsByIndex<Tables<'files'>>(
    STORES.FILES,
    'user_id',
    userId,
  );
  return files.length;
};

const updateStoredFile = async (file: Tables<'files'>): Promise<void> => {
  try {
    await putItem(STORES.FILES, file);
  } catch (error) {
    console.error('Error updating file:', error);
    throw error;
  }
};

const deleteStoredFile = async (fileId: string): Promise<void> => {
  try {
    await deleteItem(STORES.FILES, fileId);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

const updateStoredChatFiles = async (
  chatFiles: Tables<'files'>[],
): Promise<void> => {
  for (const file of chatFiles) {
    await updateStoredFile(file);
  }
};

export const files = {
  getById: getStoredFileById,
  getByChatId: getStoredChatFilesByChatId,
  getCount: getStoredFilesCount,
  update: updateStoredFile,
  updateMany: updateStoredChatFiles,
  delete: deleteStoredFile,
};

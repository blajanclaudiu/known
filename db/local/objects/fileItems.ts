import { getItem, getItemsByIndex, putItem } from '../core/indexedDB';
import { STORES } from '../schema/schema';
import type { Tables } from '@/supabase/types';

const updateStoredFileItems = async (
  fileItems: Tables<'file_items'>[],
): Promise<void> => {
  for (const fileItem of fileItems) {
    await updateStoredFileItem(fileItem);
  }
};

const getStoredFileItemById = async (
  fileItemId: string,
): Promise<Tables<'file_items'> | undefined> => {
  return await getItem<Tables<'file_items'>>(STORES.FILE_ITEMS, fileItemId);
};

const getStoredFileItemsByFileId = async (
  fileId: string,
  sortBy?: 'sequence_number',
): Promise<Tables<'file_items'>[]> => {
  const fileItems = await getItemsByIndex<Tables<'file_items'>>(
    STORES.FILE_ITEMS,
    'file_id',
    fileId,
  );
  if (sortBy === 'sequence_number') {
    return fileItems.sort((a, b) => a.sequence_number - b.sequence_number);
  } else {
    return fileItems;
  }
};

const updateStoredFileItem = async (
  fileItem: Tables<'file_items'>,
): Promise<void> => {
  await putItem(STORES.FILE_ITEMS, fileItem);
};

const getStoredMessageFileItemsByMessageId = async (
  messageId: string,
): Promise<Tables<'file_items'>[] | null> => {
  const message = await getItem<Tables<'messages'>>(STORES.MESSAGES, messageId);
  if (!message) return null;

  const messageFileItems = await getItemsByIndex<Tables<'message_file_items'>>(
    STORES.MESSAGE_FILE_ITEMS,
    'message_id',
    messageId,
  );
  const fileItems = [];
  for (const mfi of messageFileItems) {
    const fileItem = await getStoredFileItemById(mfi.file_item_id);
    if (fileItem) {
      fileItems.push(fileItem);
    }
  }

  return fileItems;
};

export const fileItems = {
  getById: getStoredFileItemById,
  getByFileId: getStoredFileItemsByFileId,
  getByMessageId: getStoredMessageFileItemsByMessageId,
  update: updateStoredFileItem,
  updateMany: updateStoredFileItems,
};

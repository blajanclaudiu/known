import type { Tables } from '@/supabase/types';
import { putItem } from '../core/indexedDB';
import { STORES } from '../schema/schema';

const updateStoredMessageFileItems = async (
  messageFileItems: Tables<'message_file_items'>[],
): Promise<void> => {
  for (const messageFileItem of messageFileItems) {
    await putItem(STORES.MESSAGE_FILE_ITEMS, messageFileItem);
  }
};

export const messageFileItems = {
  updateMany: updateStoredMessageFileItems,
};

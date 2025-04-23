import type { MessageImage } from '@/types/images/message-image';
import { getItem, putItem } from '../core/indexedDB';
import { STORES } from '../schema/schema';

// New image storage functions
const storeMessageImage = async (image: MessageImage): Promise<void> => {
  try {
    await putItem(STORES.MESSAGE_IMAGES, image);
  } catch (error) {
    console.error('Error storing message image:', error);
    throw error;
  }
};

const getStoredMessageImageByPath = async (
  path: string,
): Promise<MessageImage | undefined> => {
  return await getItem(STORES.MESSAGE_IMAGES, path);
};

export const messageImages = {
  store: storeMessageImage,
  getByPath: getStoredMessageImageByPath,
};

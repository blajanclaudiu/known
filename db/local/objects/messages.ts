import { getItemsByIndex, putItem } from '../core/indexedDB';

import type { Tables } from '@/supabase/types';
import { STORES } from '../schema/schema';
import type { MessageWithFileItemsAndFeedback } from '../../messages';
import { getItem, deleteItem } from '../core/indexedDB';
import type { MessageImage } from '@/types/images/message-image';

const getStoredMessageById = async (
  messageId: string,
): Promise<MessageWithFileItemsAndFeedback | undefined> => {
  try {
    const message = await getItem<Tables<'messages'>>(
      STORES.MESSAGES,
      messageId,
    );
    if (!message) return undefined;

    // Get message-file-item relationships
    const messageFileItems = await getItemsByIndex<{
      message_id: string;
      file_item_id: string;
      user_id: string;
    }>(STORES.MESSAGE_FILE_ITEMS, 'message_id', messageId);

    // Get file items using the relationships
    const file_items: Tables<'file_items'>[] = [];
    for (const relationship of messageFileItems) {
      const fileItem = await getItem<Tables<'file_items'>>(
        STORES.FILE_ITEMS,
        relationship.file_item_id,
      );
      if (fileItem) {
        file_items.push(fileItem);
      }
    }

    // Get feedback
    const feedback = await getItemsByIndex<Tables<'feedback'>>(
      STORES.FEEDBACK,
      'message_id',
      messageId,
    );

    return {
      ...message,
      file_items,
      feedback,
    };
  } catch (error) {
    console.error('Error getting message:', error);
    throw error;
  }
};

const getStoredMessagesByChatId = async (
  chatId: string,
  limit = 20,
  lastSequenceNumber?: number,
): Promise<MessageWithFileItemsAndFeedback[] | undefined> => {
  try {
    const chat = await getItem<Tables<'chats'>>(STORES.CHATS, chatId);
    if (!chat) return undefined;

    // Get all messages for this chat
    const messages = await getItemsByIndex<Tables<'messages'>>(
      STORES.MESSAGES,
      'chat_id',
      chatId,
    );

    // Filter messages by sequence number if needed
    let filteredMessages = messages;
    if (lastSequenceNumber !== undefined) {
      filteredMessages = messages.filter(
        (message) => message.sequence_number < lastSequenceNumber,
      );
    }

    // For each message, get its file items and feedback
    const result: MessageWithFileItemsAndFeedback[] = [];
    for (const message of filteredMessages) {
      const messageWithItems = await getStoredMessageById(message.id);
      if (messageWithItems) {
        result.push(messageWithItems);
      }
    }

    // Sort messages by sequence number and limit the results
    result.sort((a, b) => b.sequence_number - a.sequence_number);
    return result.slice(0, limit).reverse();
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

const deleteStoredMessageImagesByMessageId = async (
  messageId: string,
): Promise<void> => {
  try {
    await deleteItem(STORES.MESSAGE_IMAGES, messageId);
  } catch (error) {
    console.error('Error deleting message images:', error);
    throw error;
  }
};

const deleteStoredMessage = async (messageId: string): Promise<void> => {
  try {
    const message = await getItem<Tables<'messages'>>(
      STORES.MESSAGES,
      messageId,
    );
    if (!message) return;

    // Get message-file-item relationships
    const messageFileItems = await getItemsByIndex<{
      message_id: string;
      file_item_id: string;
    }>(STORES.MESSAGE_FILE_ITEMS, 'message_id', messageId);

    // Delete the message-file-item relationships
    for (const relationship of messageFileItems) {
      await deleteItem(STORES.MESSAGE_FILE_ITEMS, [
        relationship.message_id,
        relationship.file_item_id,
      ]);
    }

    // Delete the message-image relationships
    const messageImages = await getItemsByIndex<MessageImage>(
      STORES.MESSAGE_IMAGES,
      'message_id',
      messageId,
    );
    for (const image of messageImages) {
      await deleteItem(STORES.MESSAGE_IMAGES, image.path);
    }

    // Delete the message
    await deleteItem(STORES.MESSAGES, messageId);

    // Delete related feedback
    const feedback = await getItemsByIndex<Tables<'feedback'>>(
      STORES.FEEDBACK,
      'message_id',
      messageId,
    );
    for (const item of feedback) {
      await deleteItem(STORES.FEEDBACK, item.id);
    }

    // Delete related images
    await deleteStoredMessageImagesByMessageId(messageId);
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

const updateStoredMessage = async (
  message: Tables<'messages'>,
): Promise<void> => {
  try {
    await putItem(STORES.MESSAGES, message);
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
};

const deleteStoredMessagesIncludingAndAfter = async (
  userId: string,
  chatId: string,
  sequenceNumber: number,
): Promise<void> => {
  try {
    // Get all messages for this chat
    const messages = await getItemsByIndex<Tables<'messages'>>(
      STORES.MESSAGES,
      'chat_id',
      chatId,
    );

    // Filter messages to delete
    const messagesToDelete = messages.filter(
      (m) => m.sequence_number >= sequenceNumber,
    );

    // Delete each message
    for (const message of messagesToDelete) {
      await deleteStoredMessage(message.id);
    }
  } catch (error) {
    console.error('Error deleting messages:', error);
    throw error;
  }
};

const updateStoredMessages = async (messages: Tables<'messages'>[]) => {
  try {
    for (const message of messages) {
      await updateStoredMessage(message);
    }
  } catch (error) {
    console.error('Error updating messages:', error);
    throw error;
  }
};

export const messages = {
  // Message related functions
  getById: getStoredMessageById,
  getByChatId: getStoredMessagesByChatId,
  update: updateStoredMessage,
  updateMany: updateStoredMessages,
  delete: deleteStoredMessage,
  deleteIncludingAndAfter: deleteStoredMessagesIncludingAndAfter,
};

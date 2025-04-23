import { supabase } from '@/lib/supabase/browser-client';
import { localDB } from './local/db';

export const getChatFilesByChatId = async (
  chatId: string,
  useStored = true,
) => {
  const storedChatFiles = await localDB.files.getByChatId(chatId);
  if (useStored && storedChatFiles) {
    return storedChatFiles;
  }

  const { data: chatFiles, error } = await supabase
    .from('files')
    .select('*')
    .eq('chat_id', chatId);

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned, chat not found
      return null;
    }
    // For other types of errors, we still throw
    throw new Error(`Error fetching chat files: ${error.message}`);
  }

  await localDB.files.updateMany(chatFiles);

  return chatFiles;
};

export const getChatFilesByMultipleChatIds = async (chatIds: string[]) => {
  if (chatIds.length === 0) {
    return [];
  }

  const { data: chatFiles, error } = await supabase
    .from('files')
    .select('*')
    .in('chat_id', chatIds);

  if (error) {
    throw new Error(`Error fetching chat files: ${error.message}`);
  }

  await localDB.files.updateMany(chatFiles);

  return chatFiles;
};

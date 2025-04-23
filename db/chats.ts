import { supabase } from '@/lib/supabase/browser-client';
import type { TablesInsert, TablesUpdate, Tables } from '@/supabase/types';
import { localDB } from './local/db';
import { refreshLocalData } from './refresh-local-data';

export const getChatById = async (chatId: string) => {
  const storedChat = await localDB.chats.getById(chatId);
  if (storedChat) {
    return storedChat;
  }

  const { data: chat, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (chat) {
    await localDB.chats.update(chat);
  }

  return chat;
};

export const createChat = async (chat: TablesInsert<'chats'>) => {
  const { data: createdChat, error } = await supabase
    .from('chats')
    .insert([chat])
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await localDB.chats.update(createdChat);

  return createdChat;
};

export const updateChat = async (
  chatId: string,
  chat: TablesUpdate<'chats'>,
) => {
  const { data: updatedChat, error } = await supabase
    .from('chats')
    .update(chat)
    .eq('id', chatId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await localDB.chats.update(updatedChat);

  return updatedChat;
};

export const deleteChat = async (chatId: string) => {
  const { error } = await supabase.from('chats').delete().eq('id', chatId);

  if (error) {
    throw new Error(error.message);
  }

  await localDB.chats.delete(chatId);

  return true;
};

export const deleteAllChats = async (userId: string) => {
  const { error: chatDeleteError } = await supabase
    .from('chats')
    .delete()
    .eq('user_id', userId);

  if (chatDeleteError) {
    throw new Error(chatDeleteError.message);
  }

  await localDB.chats.deleteAll(userId);

  return true;
};

export const getChatsByUserId = async (
  userId: string,
  useStored = true,
): Promise<Tables<'chats'>[]> => {
  const storedChats = await localDB.chats.getByUserId(userId);
  if (useStored && storedChats) {
    return storedChats;
  }

  const { data: chats, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) {
    throw new Error(error.message);
  }

  await localDB.chats.updateMany(chats);

  return chats;
};

export const getMoreChatsByUserId = async (
  userId: string,
  lastChatCreatedAt: string,
) => {
  const { data: chats, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .lt('created_at', lastChatCreatedAt)
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) {
    throw new Error(error.message);
  }

  await refreshLocalData(chats);

  await localDB.chats.updateMany(chats);

  return chats;
};

export const getLastSharedMessageId = async (chatId: string) => {
  const storedChat = await localDB.chats.getById(chatId);
  if (storedChat) {
    return storedChat.last_shared_message_id;
  }

  const { data, error } = await supabase
    .from('chats')
    .select('last_shared_message_id')
    .eq('id', chatId)
    .eq('sharing', 'public')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data?.last_shared_message_id;
};

export const getSharedChatsByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .eq('sharing', 'public')
    .order('shared_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

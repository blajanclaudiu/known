import { supabase } from '@/lib/supabase/browser-client';
import type { TablesInsert } from '@/supabase/types';
import { localDB } from './local/db';

export const createMessageFeedback = async (
  feedback: TablesInsert<'feedback'>,
) => {
  const { data: createdFeedback, error } = await supabase
    .from('feedback')
    .upsert(feedback, { onConflict: 'user_id, chat_id, message_id' })
    .select('*');

  if (!createdFeedback) {
    throw new Error(error.message);
  }

  await localDB.feedback.updateMany(createdFeedback);

  return createdFeedback;
};

export const getFeedbackByMultipleChatIds = async (chatIds: string[]) => {
  if (chatIds.length === 0) {
    return [];
  }

  const { data: feedback } = await supabase
    .from('feedback')
    .select('*')
    .in('chat_id', chatIds);

  if (!feedback) {
    throw new Error('Feedback not found');
  }

  await localDB.feedback.updateMany(feedback);

  return feedback;
};

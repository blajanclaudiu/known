import type { Tables } from '@/supabase/types';
import { putItem } from '../core/indexedDB';
import { STORES } from '../schema/schema';

const updateStoredFeedback = async (
  feedback: Tables<'feedback'>,
): Promise<void> => {
  await putItem(STORES.FEEDBACK, feedback);
};

const updateStoredFeedbacks = async (
  feedbacks: Tables<'feedback'>[],
): Promise<void> => {
  for (const feedback of feedbacks) {
    await updateStoredFeedback(feedback);
  }
};

export const feedback = {
  update: updateStoredFeedback,
  updateMany: updateStoredFeedbacks,
};

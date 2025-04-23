import { generateObject } from 'ai';
import { myProvider } from './providers';
import { DEFAULT_TITLE_GENERATION_PROMPT_TEMPLATE } from './prompts';
import { extractTextContent } from './message-utils';
import { z } from 'zod';
import { waitUntil } from '@vercel/functions';
import type { BuiltChatMessage, LLMID, ChatMetadata } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TablesUpdate } from '@/supabase/types';

export async function createChatWithWaitUntil({
  supabase,
  chatId,
  userId,
  model,
  title,
  content,
  finishReason,
}: {
  supabase: SupabaseClient;
  chatId: string;
  userId: string;
  model: LLMID;
  title?: string;
  content: string;
  finishReason: string;
}) {
  waitUntil(
    (async () => {
      try {
        const { data: _, error } = await supabase
          .from('chats')
          .insert([
            {
              id: chatId,
              user_id: userId,
              include_profile_context: true,
              model,
              name: title || content.substring(0, 100),
              finish_reason: finishReason,
            },
          ])
          .select('*')
          .single();

        if (error) {
          // If it's a duplicate key error, update instead
          if (error.code === '23505') {
            const { error: updateError } = await supabase
              .from('chats')
              .update({
                updated_at: new Date().toISOString(),
                finish_reason: finishReason,
                model,
              })
              .eq('id', chatId);

            if (updateError) {
              console.error('Error updating chat:', updateError);
            }
            return;
          }

          console.error('Error creating chat:', error);
          return;
        }

        // console.log('Created chat:', createdChat);
      } catch (error) {
        console.error('Error in waitUntil:', error);
      }
    })(),
  );
}

export async function updateChatWithWaitUntil({
  supabase,
  chatId,
  updates,
}: {
  supabase: SupabaseClient;
  chatId: string;
  updates: TablesUpdate<'chats'>;
}) {
  waitUntil(
    (async () => {
      try {
        const { data: _, error } = await supabase
          .from('chats')
          .update(updates)
          .eq('id', chatId)
          .select('*')
          .single();

        if (error) {
          console.error('Error updating chat:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            chatId,
            updates,
          });
          return;
        }

        // console.log('Updated chat:', updatedChat);
      } catch (error) {
        console.error('Error in waitUntil:', {
          error,
          chatId,
          updates,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    })(),
  );
}

export async function generateTitleFromUserMessage({
  messages,
  abortSignal,
}: {
  messages: BuiltChatMessage[];
  abortSignal: AbortSignal;
}) {
  try {
    const message =
      messages.find((m: { role: string }) => m.role === 'user') ||
      messages[messages.length - 1];
    const textContent = extractTextContent(message.content);

    const {
      object: { title },
    } = await generateObject({
      model: myProvider.languageModel('chat-model-small'),
      schema: z.object({
        title: z.string().describe('The generated title (3-5 words)'),
      }),
      messages: [
        {
          role: 'user',
          content: DEFAULT_TITLE_GENERATION_PROMPT_TEMPLATE(textContent),
        },
      ],
      abortSignal,
      maxTokens: 50,
    });

    return title;
  } catch (error) {
    console.error('[Title Generation] Error:', error);
    // Return a fallback title based on the first message content
    const message =
      messages.find((m: { role: string }) => m.role === 'user') ||
      messages[messages.length - 1];
    const textContent = extractTextContent(message.content);
    return textContent.substring(0, 100).trim();
  }
}

export async function handleChatWithMetadata({
  supabase,
  chatMetadata,
  profile,
  model,
  title,
  messages,
  finishReason,
}: {
  supabase: SupabaseClient;
  chatMetadata: ChatMetadata;
  profile: { user_id: string };
  model: LLMID;
  title?: string;
  messages: any[];
  finishReason: string;
}) {
  if (!chatMetadata.id) return;

  if (chatMetadata.newChat) {
    await createChatWithWaitUntil({
      supabase,
      chatId: chatMetadata.id,
      userId: profile.user_id,
      model,
      title,
      content: extractTextContent(messages[messages.length - 1].content),
      finishReason,
    });
  } else {
    await updateChatWithWaitUntil({
      supabase,
      chatId: chatMetadata.id,
      updates: {
        updated_at: new Date().toISOString(),
        finish_reason: finishReason,
        model,
      },
    });
  }
}

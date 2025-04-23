import { getAIProfile } from '@/lib/server/server-chat-helpers';
import { handleErrorResponse } from '@/lib/models/api-error';
import llmConfig from '@/lib/models/llm-config';
import { checkRatelimitOnApi } from '@/lib/server/ratelimiter';
import { createDataStreamResponse, smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import PostHogClient from '@/app/posthog';
import { handleToolExecution } from '@/lib/ai/tool-handler';
import { createToolSchemas } from '@/lib/ai/tools/toolSchemas';
import { processRag } from '@/lib/ai/rag-processor';
import {
  processChatMessages,
  toVercelChatMessages,
} from '@/lib/ai/message-utils';
import { type LLMID, PluginID } from '@/types';
import {
  generateTitleFromUserMessage,
  handleChatWithMetadata,
} from '@/lib/ai/actions';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export const maxDuration = 600;

export const preferredRegion = [
  'iad1',
  'arn1',
  'bom1',
  'cdg1',
  'cle1',
  'cpt1',
  'dub1',
  'fra1',
  'gru1',
  'hnd1',
  'icn1',
  'kix1',
  'lhr1',
  'pdx1',
  'sfo1',
  'sin1',
  'syd1',
];

export async function POST(request: Request) {
  try {
    const { messages, model, modelParams, chatMetadata } = await request.json();

    const profile = await getAIProfile();
    const config = await getProviderConfig(
      model,
      profile,
      modelParams.selectedPlugin,
    );

    if (!config.isRateLimitAllowed) {
      return new Response(
        JSON.stringify({
          error: {
            type: 'ratelimit_hit',
            message: config.rateLimitInfo.message,
            isPremiumUser: config.isPremiumUser,
          },
        }),
        { status: 429 },
      );
    }

    let {
      messages: validatedMessages,
      selectedModel: finalSelectedModel,
      supportsImages,
      systemPrompt,
    } = await processChatMessages(
      messages,
      config.selectedModel,
      modelParams.selectedPlugin,
      modelParams.isContinuation,
      modelParams.isTerminalContinuation,
      llmConfig.openai.apiKey,
      config.isLargeModel,
      profile.profile_context,
    );

    let supabase: SupabaseClient | null = null;
    let generatedTitle: string | undefined;
    let toolUsed = '';
    if (chatMetadata.id) {
      supabase = await createClient();
    }

    request.signal.addEventListener('abort', async () => {
      const isTerminalUsed =
        modelParams.isTerminalContinuation ||
        modelParams.confirmTerminalCommand ||
        modelParams.selectedPlugin === PluginID.TERMINAL ||
        toolUsed === 'terminal';

      if (supabase) {
        await handleChatWithMetadata({
          supabase,
          chatMetadata,
          profile,
          model,
          title: generatedTitle,
          messages: validatedMessages,
          finishReason: isTerminalUsed ? 'aborted' : 'stop',
        });
      }
    });

    const toolResponse = await handleToolExecution({
      messages: validatedMessages,
      profile,
      isTerminalContinuation: modelParams.isTerminalContinuation,
      selectedPlugin: modelParams.selectedPlugin,
      isLargeModel: config.isLargeModel,
      agentMode: modelParams.agentMode,
      confirmTerminalCommand: modelParams.confirmTerminalCommand,
      abortSignal: request.signal,
      chatMetadata,
      model,
      supabase,
      isPremiumUser: config.isPremiumUser,
    });
    if (toolResponse) {
      return toolResponse;
    }

    // Process RAG
    let ragUsed = false;
    let ragId: string | null = null;
    if (modelParams.isRagEnabled) {
      const ragResult = await processRag({
        messages,
        isContinuation: modelParams.isContinuation,
        profile,
        selectedChatModel: finalSelectedModel,
      });

      ragUsed = ragResult.ragUsed;
      ragId = ragResult.ragId;
      if (ragResult.systemPrompt) {
        systemPrompt = ragResult.systemPrompt;
      }
    }

    const posthog = PostHogClient();
    if (posthog) {
      posthog.capture({
        distinctId: profile.user_id,
        event: finalSelectedModel,
      });
    }

    if (!ragUsed) {
      finalSelectedModel = config.isLargeModel
        ? 'chat-model-large-with-tools'
        : 'chat-model-small-with-tools';
    }

    try {
      return createDataStreamResponse({
        execute: async (dataStream) => {
          dataStream.writeData({
            type: 'ratelimit',
            content: config.rateLimitInfo,
          });

          const toolConfig = {
            messages: validatedMessages,
            profile,
            agentMode: modelParams.agentMode,
            confirmTerminalCommand: modelParams.confirmTerminalCommand,
            dataStream,
            abortSignal: request.signal,
            chatMetadata,
            model,
            supabase,
            isPremiumUser: config.isPremiumUser,
          };

          const result = streamText({
            model: myProvider.languageModel(finalSelectedModel),
            system: systemPrompt,
            messages: toVercelChatMessages(validatedMessages, supportsImages),
            maxTokens: 2048,
            abortSignal: request.signal,
            experimental_transform: smoothStream({ chunking: 'word' }),
            onChunk: async (chunk: any) => {
              if (chunk.chunk.type === 'tool-call') {
                toolUsed = chunk.chunk.toolName;
              }
            },
            ...(!ragUsed
              ? {
                  tools: createToolSchemas(toolConfig).getSelectedSchemas(
                    config.isLargeModel
                      ? ['browser', 'webSearch', 'terminal']
                      : ['browser', 'webSearch'],
                  ),
                }
              : {}),
            onFinish: async ({ finishReason }: { finishReason: string }) => {
              if (supabase && !toolUsed) {
                await handleChatWithMetadata({
                  supabase,
                  chatMetadata,
                  profile,
                  model,
                  title: generatedTitle,
                  messages: validatedMessages,
                  finishReason,
                });
                dataStream.writeData({ isChatSavedInBackend: true });
              }
            },
          });

          await Promise.all([
            result.mergeIntoDataStream(dataStream),
            (async () => {
              if (chatMetadata.newChat) {
                generatedTitle = await generateTitleFromUserMessage({
                  messages,
                  abortSignal: request.signal,
                });
                dataStream.writeData({ chatTitle: generatedTitle });
              }
            })(),
          ]);
        },
      });
    } catch (error) {
      return handleErrorResponse(error);
    }
  } catch (error: any) {
    const errorMessage = error.message || 'An unexpected error occurred';
    const errorCode = error.status || 500;

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode,
    });
  }
}

async function getProviderConfig(
  model: LLMID,
  profile: any,
  selectedPlugin: PluginID,
) {
  // Moving away from gpt-4-turbo-preview to chat-model-large
  const modelMap: Record<string, string> = {
    'mistral-medium': 'chat-model-small',
    'mistral-large': 'chat-model-large',
    'gpt-4-turbo-preview': 'chat-model-large',
  };
  // Moving away from gpt-4-turbo-preview to pentestgpt-pro
  const rateLimitModelMap: Record<string, string> = {
    'mistral-medium': 'pentestgpt',
    'mistral-large': 'pentestgpt-pro',
    'gpt-4-turbo-preview': 'pentestgpt-pro',
  };

  const selectedModel = modelMap[model];
  if (!selectedModel) {
    throw new Error('Selected model is undefined');
  }
  const isLargeModel = selectedModel.includes('large');

  const rateLimitModel =
    selectedPlugin !== PluginID.NONE &&
    selectedPlugin !== PluginID.ENHANCED_SEARCH
      ? selectedPlugin
      : rateLimitModelMap[model] || model;

  const rateLimitStatus = await checkRatelimitOnApi(
    profile.user_id,
    rateLimitModel,
  );

  return {
    selectedModel,
    isRateLimitAllowed: rateLimitStatus.allowed,
    isLargeModel,
    rateLimitInfo: rateLimitStatus.info,
    isPremiumUser: rateLimitStatus.info.isPremiumUser,
  };
}

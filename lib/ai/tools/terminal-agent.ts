import { toVercelChatMessages } from '@/lib/ai/message-utils';
import { streamText } from 'ai';
import { ratelimit } from '@/lib/server/ratelimiter';
import { epochTimeToNaturalLanguage } from '@/lib/utils';
import type { Sandbox } from '@e2b/code-interpreter';
import { pauseSandbox } from '@/lib/tools/e2b/sandbox';
import { createAgentTools } from '@/lib/ai/tools/agent';
import { PENTESTGPT_AGENT_SYSTEM_PROMPT } from '@/lib/models/agent-prompts';
import { myProvider } from '@/lib/ai/providers';
import { executeTerminalCommandWithConfig } from './terminal-command-executor';
import {
  generateTitleFromUserMessage,
  handleChatWithMetadata,
} from '@/lib/ai/actions';
import type { ChatMetadata, LLMID, AgentMode } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';

interface TerminalToolConfig {
  messages: any[];
  profile: any;
  dataStream: any;
  agentMode: AgentMode;
  confirmTerminalCommand: boolean;
  abortSignal: AbortSignal;
  chatMetadata: ChatMetadata;
  model: LLMID;
  supabase: SupabaseClient | null;
  isPremiumUser: boolean;
  autoSelected?: boolean;
}

export async function executeTerminalAgent({
  config,
}: {
  config: TerminalToolConfig;
}) {
  const {
    profile,
    dataStream,
    agentMode,
    abortSignal,
    chatMetadata,
    model,
    supabase,
    isPremiumUser,
    autoSelected,
  } = config;
  let messages = config.messages;

  let sandbox: Sandbox | null = null;
  const persistentSandbox = false;
  const userID = profile.user_id;

  try {
    // Check rate limit
    if (autoSelected) {
      const rateLimitResult = await ratelimit(userID, 'terminal');
      if (!rateLimitResult.allowed) {
        const waitTime = epochTimeToNaturalLanguage(
          rateLimitResult.timeRemaining!,
        );
        dataStream.writeData({
          type: 'error',
          content: `⚠️ You've reached the limit for terminal usage.\n\nTo ensure fair usage for all users, please wait ${waitTime} before trying again.`,
        });
        return 'Rate limit exceeded';
      }
    }

    // Functions to update sandbox and persistentSandbox from tools
    const setSandbox = (newSandbox: Sandbox) => {
      sandbox = newSandbox;
    };

    // Try to execute terminal command if confirmTerminalCommand is true
    if (config.confirmTerminalCommand) {
      const result = await executeTerminalCommandWithConfig({
        userID,
        dataStream,
        isPremiumUser,
        setSandbox,
        initialSandbox: sandbox || undefined,
        initialPersistentSandbox: persistentSandbox,
        messages,
      });

      if (typeof result === 'string') return result;
      messages = result.messages;
    }

    let generatedTitle: string | undefined;
    let customFinishReason: string | null = null;

    await Promise.all([
      (async () => {
        const { fullStream, finishReason } = streamText({
          model: myProvider.languageModel('chat-model-agent'),
          maxTokens: 2048,
          system: PENTESTGPT_AGENT_SYSTEM_PROMPT,
          messages: toVercelChatMessages(messages, true),
          tools: createAgentTools({
            dataStream,
            sandbox,
            userID,
            persistentSandbox,
            setSandbox,
            isPremiumUser,
            agentMode,
          }),
          maxSteps: 10,
          toolChoice: 'required',
          abortSignal,
          onFinish: async ({ finishReason }: { finishReason: string }) => {
            if (supabase) {
              await handleChatWithMetadata({
                supabase,
                chatMetadata,
                profile,
                model,
                title: generatedTitle,
                messages,
                finishReason: customFinishReason
                  ? customFinishReason
                  : finishReason,
              });
              dataStream.writeData({ isChatSavedInBackend: true });
            }
          },
        });

        // Handle stream
        let shouldStop = false;
        for await (const chunk of fullStream) {
          if (chunk.type === 'text-delta') {
            dataStream.writeData({
              type: 'text-delta',
              content: chunk.textDelta,
            });
          } else if (chunk.type === 'tool-call') {
            if (chunk.toolName === 'idle') {
              dataStream.writeData({ finishReason: 'idle' });
              customFinishReason = 'idle';
              shouldStop = true;
            } else if (chunk.toolName === 'message_ask_user') {
              dataStream.writeData({
                type: 'text-delta',
                content: chunk.args?.text,
              });
              dataStream.writeData({ finishReason: 'message_ask_user' });
              customFinishReason = 'message_ask_user';
              shouldStop = true;
            } else if (
              agentMode === 'ask-every-time' &&
              chunk.toolName === 'shell_exec'
            ) {
              const { exec_dir, command } = chunk.args;
              dataStream.writeData({
                type: 'text-delta',
                content: `<terminal-command exec-dir="${exec_dir}">${command}</terminal-command>`,
              });
              dataStream.writeData({
                finishReason: 'terminal_command_ask_user',
              });
              customFinishReason = 'terminal_command_ask_user';
              shouldStop = true;
            }
          }
        }

        // Send finish reason if not already sent
        if (!shouldStop) {
          const originalFinishReason = await finishReason;
          dataStream.writeData({ finishReason: originalFinishReason });
        }
      })(),
      (async () => {
        if (chatMetadata?.newChat && !autoSelected) {
          generatedTitle = await generateTitleFromUserMessage({
            messages,
            abortSignal,
          });
          dataStream.writeData({ chatTitle: generatedTitle });
        }
      })(),
    ]);

    return 'Terminal execution completed';
  } catch (error) {
    console.error('[TerminalAgent] Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    dataStream.writeData({
      type: 'error',
      content: 'An error occurred during terminal execution. Please try again.',
    });
    throw error;
  } finally {
    // Pause sandbox at the end of the API request
    if (sandbox && persistentSandbox) {
      await pauseSandbox(sandbox);
    }
  }
}

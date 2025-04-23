import {
  customProvider,
  wrapLanguageModel,
  extractReasoningMiddleware,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { openrouter } from '@openrouter/ai-sdk-provider';

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': openai('gpt-4.1-mini-2025-04-14'),
    'chat-model-large': openai('gpt-4.1-2025-04-14'),
    'chat-model-small-with-tools': openai('gpt-4.1-mini-2025-04-14', {
      parallelToolCalls: false,
    }),
    'chat-model-large-with-tools': openai('gpt-4.1-2025-04-14', {
      parallelToolCalls: false,
    }),
    'chat-model-agent': openai('gpt-4.1-2025-04-14', {
      parallelToolCalls: false,
    }),
    'chat-model-reasoning': wrapLanguageModel({
      model: openrouter('x-ai/grok-3-mini-beta', {
        extraBody: {
          reasoning: { effort: 'high' },
        },
      }),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
  },
});

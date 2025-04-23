import type {
  BuiltChatMessage,
  ChatMessage,
  ChatPayload,
  MessageImage,
  LLMID,
} from '@/types';
import type { Tables } from '@/supabase/types';
import { countTokens } from 'gpt-tokenizer';
import { SmallModel, LargeModel } from './models/hackerai-llm-list';
import { toast } from 'sonner';

export async function buildFinalMessages(
  payload: ChatPayload,
  model: LLMID,
  chatImages: MessageImage[],
): Promise<BuiltChatMessage[]> {
  const { chatMessages, retrievedFileItems } = payload;

  let CHUNK_SIZE = 12000;
  if (model === LargeModel.modelId) {
    CHUNK_SIZE = 32000 - 4000; // -4000 for the system prompt, custom instructions, and more
  } else if (model === SmallModel.modelId) {
    CHUNK_SIZE = 12000 - 4000; // -4000 for the system prompt, custom instructions, and more
  }

  let remainingTokens = CHUNK_SIZE;

  const lastUserMessage = chatMessages[chatMessages.length - 2].message.content;
  const lastUserMessageContent = Array.isArray(lastUserMessage)
    ? lastUserMessage
        .map((item) => (item.type === 'text' ? item.text : ''))
        .join(' ')
    : lastUserMessage;
  const lastUserMessageTokens = countTokens(lastUserMessageContent);

  if (lastUserMessageTokens > CHUNK_SIZE) {
    const errorMessage =
      'The message you submitted was too long, please submit something shorter.';
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }

  const processedChatMessages = chatMessages.map((chatMessage, index) => {
    const nextChatMessage = chatMessages[index + 1];

    if (nextChatMessage === undefined) {
      return chatMessage;
    }

    const returnMessage: ChatMessage = {
      ...chatMessage,
    };

    if (
      chatMessage.fileItems.length > 0 &&
      chatMessage.message.role === 'user'
    ) {
      // Create a structured document format for file content
      const documentsText = buildDocumentsText(chatMessage.fileItems);

      returnMessage.message = {
        ...returnMessage.message,
        content: `${documentsText}\n\n${chatMessage.message.content}`,
      };
      returnMessage.fileItems = [];
    }

    return returnMessage;
  });

  const truncatedMessages: any[] = [];

  for (let i = processedChatMessages.length - 1; i >= 0; i--) {
    const messageSizeLimit = Number(process.env.MESSAGE_SIZE_LIMIT || 12000);
    if (
      processedChatMessages[i].message.role === 'assistant' &&
      processedChatMessages[i].message.content.length > messageSizeLimit
    ) {
      const messageSizeKeep = Number(process.env.MESSAGE_SIZE_KEEP || 2000);
      processedChatMessages[i].message = {
        ...processedChatMessages[i].message,
        content: `${processedChatMessages[i].message.content.slice(0, messageSizeKeep)}\n... [output truncated]`,
      };
    }
    const message = processedChatMessages[i].message;

    const messageTokens = countTokens(message.content);

    if (messageTokens <= remainingTokens) {
      remainingTokens -= messageTokens;
      truncatedMessages.unshift(message);
    } else {
      break;
    }
  }

  const finalMessages: BuiltChatMessage[] = truncatedMessages.map((message) => {
    let content;

    if (message.image_paths.length > 0 && message.role !== 'assistant') {
      content = [
        {
          type: 'text',
          text: message.content,
        },
        ...message.image_paths.map((path: string) => {
          let formedUrl = '';

          if (path.startsWith('data')) {
            formedUrl = path;
          } else {
            const chatImage = chatImages.find((image) => image.path === path);

            if (chatImage) {
              formedUrl = chatImage.base64;
            }
          }

          return {
            type: 'image_url',
            image_url: {
              url: formedUrl,
            },
          };
        }),
      ];
    } else {
      content = message.content;
    }

    return {
      role: message.role,
      content,
    };
  });

  if (retrievedFileItems.length > 0) {
    const documentsText = buildDocumentsText(retrievedFileItems);

    finalMessages[finalMessages.length - 2] = {
      ...finalMessages[finalMessages.length - 2],
      content: `${documentsText}\n\n${finalMessages[finalMessages.length - 2].content}`,
    };
  }

  return finalMessages;
}

function buildDocumentsText(fileItems: Tables<'file_items'>[]) {
  const fileGroups: Record<
    string,
    { id: string; name: string; content: string[] }
  > = fileItems.reduce(
    (
      acc: Record<string, { id: string; name: string; content: string[] }>,
      item: Tables<'file_items'>,
    ) => {
      if (!acc[item.file_id]) {
        acc[item.file_id] = {
          id: item.file_id,
          name: item.name || 'unnamed file',
          content: [],
        };
      }
      acc[item.file_id].content.push(item.content);
      return acc;
    },
    {},
  );

  const documents = Object.values(fileGroups)
    .map((file: any) => {
      return `<document id="${file.id}">
<source>${file.name}</source>
<document_content>${file.content.join('\n\n')}</document_content>
</document>`;
    })
    .join('\n\n');

  return `<documents>\n${documents}\n</documents>`;
}

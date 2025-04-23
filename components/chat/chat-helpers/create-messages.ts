import { createMessageFileItems } from '@/db/message-file-items';
import {
  createMessages,
  deleteMessage,
  deleteMessagesIncludingAndAfter,
  updateMessage,
} from '@/db/messages';
import { uploadMessageImage } from '@/db/storage/message-images';
import { lastSequenceNumber } from '@/lib/utils';
import type { Tables, TablesInsert } from '@/supabase/types';
import {
  type ChatMessage,
  type LLM,
  type MessageImage,
  PluginID,
} from '@/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export const handleCreateMessages = async (
  chatMessages: ChatMessage[],
  currentChat: Tables<'chats'> | null,
  profile: Tables<'profiles'>,
  modelData: LLM,
  messageContent: string | null,
  generatedText: string,
  newMessageImages: MessageImage[],
  isRegeneration: boolean,
  isContinuation: boolean,
  retrievedFileItems: Tables<'file_items'>[],
  setMessages: (messages: ChatMessage[]) => void,
  setChatImages: React.Dispatch<React.SetStateAction<MessageImage[]>>,
  selectedPlugin: PluginID,
  editSequenceNumber?: number,
  ragUsed?: boolean,
  ragId?: string | null,
  isTemporary = false,
  citations?: string[],
  thinkingText?: string,
  thinkingElapsedSecs?: number | null,
  newChatFiles?: { id: string }[],
  setChatFiles?: React.Dispatch<React.SetStateAction<Tables<'files'>[]>>,
) => {
  const isEdit = editSequenceNumber !== undefined;

  // If it's a temporary chat, don't create messages in the database
  if (isTemporary || !currentChat) {
    const tempUserMessage: ChatMessage = {
      message: {
        id: uuidv4(),
        chat_id: '',
        content: messageContent || '',
        role: 'user',
        thinking_content: null,
        thinking_enabled: selectedPlugin === PluginID.REASONING,
        thinking_elapsed_secs: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sequence_number: lastSequenceNumber(chatMessages) + 1,
        user_id: profile.user_id,
        model: modelData.modelId,
        plugin: selectedPlugin,
        image_paths: newMessageImages.map((image) => image.path),
        rag_used: ragUsed || false,
        rag_id: ragId || null,
        citations: [],
        fragment: null,
      },
      fileItems: retrievedFileItems,
      isFinal: false,
    };

    const tempAssistantMessage: ChatMessage = {
      message: {
        id: uuidv4(),
        chat_id: '',
        content: generatedText,
        thinking_content: thinkingText || null,
        thinking_enabled: selectedPlugin === PluginID.REASONING,
        thinking_elapsed_secs: thinkingElapsedSecs || null,
        role: 'assistant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sequence_number: lastSequenceNumber(chatMessages) + 2,
        user_id: profile.user_id,
        model: modelData.modelId,
        plugin: selectedPlugin,
        image_paths: [],
        rag_used: ragUsed || false,
        rag_id: ragId || null,
        citations: citations || [],
        fragment: null,
      },
      fileItems: [],
      isFinal: false,
    };

    setMessages([...chatMessages, tempUserMessage, tempAssistantMessage]);
    return;
  }

  const finalUserMessage: TablesInsert<'messages'> = {
    chat_id: currentChat.id,
    user_id: profile.user_id,
    content: messageContent || '',
    thinking_content: null,
    thinking_enabled: selectedPlugin === PluginID.REASONING,
    thinking_elapsed_secs: null,
    model: modelData.modelId,
    plugin: selectedPlugin,
    role: 'user',
    sequence_number: lastSequenceNumber(chatMessages) + 1,
    image_paths: [],
    rag_used: ragUsed || false,
    rag_id: ragId || null,
    citations: [],
    fragment: null,
  };

  const finalAssistantMessage: TablesInsert<'messages'> = {
    chat_id: currentChat.id,
    user_id: profile.user_id,
    content: generatedText,
    thinking_content: thinkingText || null,
    thinking_enabled: selectedPlugin === PluginID.REASONING,
    thinking_elapsed_secs: thinkingElapsedSecs || null,
    model: modelData.modelId,
    plugin: selectedPlugin,
    role: 'assistant',
    sequence_number: lastSequenceNumber(chatMessages) + 2,
    image_paths: [],
    rag_used: ragUsed || false,
    rag_id: ragId || null,
    citations: citations || [],
    fragment: null,
  };

  let finalChatMessages: ChatMessage[] = [];

  // If the user is editing a message, delete all messages after the edited message
  if (isEdit) {
    const { files, error } = await deleteMessagesIncludingAndAfter(
      profile.user_id,
      currentChat.id,
      editSequenceNumber,
      true,
    );

    newChatFiles = files.map((file) => ({
      id: file.id,
    }));

    if (error) {
      toast.error('Error deleting messages:', {
        description: error,
      });
    }
  }

  if (isRegeneration) {
    const lastMessageId = chatMessages[chatMessages.length - 1].message.id;
    await deleteMessage(lastMessageId);

    const createdMessages = await createMessages(
      [finalAssistantMessage],
      [],
      currentChat?.id,
      setChatFiles,
    );

    await createMessageFileItems(
      retrievedFileItems.map((fileItem) => {
        return {
          user_id: profile.user_id,
          message_id: createdMessages[0].id,
          file_item_id: fileItem.id,
        };
      }),
    );

    setChatImages((prevChatImages) => [...prevChatImages]);

    finalChatMessages = [
      ...chatMessages.slice(0, -1),
      {
        message: createdMessages[0],
        fileItems: retrievedFileItems,
      },
    ];

    setMessages(finalChatMessages);
  } else if (isContinuation) {
    const lastStartingMessage = chatMessages[chatMessages.length - 1].message;

    const updatedMessage = await updateMessage(lastStartingMessage.id, {
      content: lastStartingMessage.content + generatedText,
    });

    chatMessages[chatMessages.length - 1].message = updatedMessage;

    finalChatMessages = [...chatMessages];

    setMessages(finalChatMessages);
  } else {
    const createdMessages = await createMessages(
      [finalUserMessage, finalAssistantMessage],
      newChatFiles || [],
      currentChat?.id,
      setChatFiles,
    );

    // Upload each image (stored in newMessageImages) for the user message to message_images bucket
    const uploadPromises = newMessageImages
      .filter((obj) => obj.file !== null)
      .map((obj) => {
        const filePath = `${profile.user_id}/${currentChat.id}/${
          createdMessages[0].id
        }/${uuidv4()}`;

        return uploadMessageImage(filePath, obj.file as File).catch((error) => {
          console.error(`Failed to upload image at ${filePath}:`, error);
          return null;
        });
      });

    const paths = (await Promise.all(uploadPromises)).filter(
      Boolean,
    ) as string[];

    const newImages = newMessageImages.map((obj, index) => ({
      ...obj,
      messageId: createdMessages[0].id,
      path: paths[index],
    }));

    setChatImages((prevImages) => [...prevImages, ...newImages]);

    let messageWithPaths = createdMessages[0];
    if (paths.length > 0) {
      messageWithPaths = await updateMessage(createdMessages[0].id, {
        image_paths: paths,
      });
    }

    await createMessageFileItems(
      retrievedFileItems.map((fileItem) => {
        return {
          user_id: profile.user_id,
          message_id: createdMessages[0].id,
          file_item_id: fileItem.id,
        };
      }),
    );

    finalChatMessages = [
      ...(isEdit
        ? chatMessages.filter(
            (chatMessage) =>
              chatMessage.message.sequence_number < editSequenceNumber,
          )
        : chatMessages),
      {
        message: messageWithPaths,
        fileItems: retrievedFileItems,
        isFinal: true,
      },
      {
        message: createdMessages[1],
        fileItems: [],
        isFinal: true,
      },
    ];

    setMessages(finalChatMessages);
  }
};

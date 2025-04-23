import { useAlertContext } from '@/context/alert-context';
import { PentestGPTContext } from '@/context/context';
import type { Tables, TablesInsert } from '@/supabase/types';
import type {
  ChatMessage,
  ChatMetadata,
  ChatPayload,
  LLMID,
  ModelParams,
  ModelWithWebSearch,
  AgentMode,
} from '@/types';
import { PluginID } from '@/types/plugins';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useRef } from 'react';
import { LLM_LIST } from '../../../lib/models/llm-list';
import { v4 as uuidv4 } from 'uuid';
import { useUIContext } from '@/context/ui-context';
import { createMessageFeedback } from '@/db/message-feedback';
import {
  createTempMessages,
  handleCreateChat,
  handleCreateMessages,
  handleHostedChat,
  validateChatSettings,
} from '../chat-helpers';
import { getMessageFileItemsByMessageId } from '@/db/message-file-items';
import { useRetrievalLogic } from './retrieval-logic';

export const useChatHandler = () => {
  const router = useRouter();
  const { dispatch: alertDispatch } = useAlertContext();

  const {
    chatFiles,
    setUserInput,
    setNewMessageImages,
    profile,
    setChatMessages,
    selectedChat,
    setSelectedChat,
    setChats,
    abortController,
    setAbortController,
    chatSettings,
    newMessageImages,
    chatMessages,
    chatImages,
    setChatImages,
    setChatFiles,
    setNewMessageFiles,
    newMessageFiles,
    useRetrieval,
    sourceCount,
    setChatSettings,
    setUseRetrieval,
    isTemporaryChat,
    temporaryChatMessages,
    setTemporaryChatMessages,
  } = useContext(PentestGPTContext);

  const {
    setIsGenerating,
    setFirstTokenReceived,
    setToolInUse,
    isGenerating,
    setIsReadyToChat,
    setSelectedPlugin,
    setAgentStatus,
    toolInUse,
  } = useUIContext();

  let { selectedPlugin } = useUIContext();

  const isGeneratingRef = useRef(isGenerating);

  const { retrievalLogic } = useRetrievalLogic();

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize chat settings on component mount
  useEffect(() => {
    if (selectedChat?.model) {
      setChatSettings((prevSettings) => ({
        ...prevSettings,
        model: selectedChat.model as LLMID,
      }));
    }
  }, [selectedChat, setChatSettings]);

  const handleSelectChat = async (
    chat: Tables<'chats'> | { chat_id: string },
  ) => {
    await handleStopMessage();
    setIsReadyToChat(false);

    // Handle both full chat object and search result
    const chatId = 'id' in chat ? chat.id : chat.chat_id;

    if ('model' in chat && chat.model) {
      setChatSettings((prevSettings) => ({
        ...prevSettings,
        model: chat.model as LLMID,
      }));
    }

    return router.push(`/c/${chatId}`);
  };

  const handleNewChat = async () => {
    await handleStopMessage();

    setUserInput('');
    setChatMessages([]);
    setSelectedChat(null);

    setIsGenerating(false);
    setFirstTokenReceived(false);

    setChatFiles([]);
    setChatImages([]);
    setNewMessageFiles([]);
    setNewMessageImages([]);
    setUseRetrieval(false);

    setToolInUse('none');
    setAgentStatus(null);
    setSelectedPlugin(PluginID.NONE);

    setIsReadyToChat(true);
    return router.push(`/c`);
  };

  const handleFocusChatInput = () => {
    chatInputRef.current?.focus();
  };

  const handleStopMessage = async () => {
    if (abortController && !abortController.signal.aborted) {
      abortController.abort();
      while (isGeneratingRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update chat's finish reason to 'aborted' when terminal in use
      if (
        selectedChat &&
        (toolInUse === PluginID.TERMINAL ||
          toolInUse === 'temporary-sandbox' ||
          toolInUse === 'persistent-sandbox')
      ) {
        const updatedChat = {
          ...selectedChat,
          updated_at: new Date().toISOString(),
          finish_reason: 'aborted',
        };

        // Only update state if we're still on the same chat
        if (selectedChat.id === updatedChat.id) {
          setChats((prevChats) => {
            const updatedChats = prevChats.map((prevChat) =>
              prevChat.id === updatedChat.id ? updatedChat : prevChat,
            );
            return updatedChats;
          });

          setSelectedChat(updatedChat);
        }
      }
    }
  };

  const handleSendFeedback = async (
    chatMessage: ChatMessage,
    feedback: 'good' | 'bad',
    reason?: string,
    detailedFeed?: string,
    allow_email?: boolean,
    allow_sharing?: boolean,
  ) => {
    const feedbackInsert: TablesInsert<'feedback'> = {
      message_id: chatMessage.message.id,
      user_id: chatMessage.message.user_id,
      chat_id: chatMessage.message.chat_id,
      feedback: feedback,
      reason: reason ?? chatMessage.feedback?.reason,
      detailed_feedback:
        detailedFeed ?? chatMessage.feedback?.detailed_feedback,
      model: chatMessage.message.model,
      created_at: chatMessage.feedback?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sequence_number: chatMessage.message.sequence_number,
      allow_email: allow_email,
      allow_sharing: allow_sharing,
      has_files: chatMessage.fileItems.length > 0,
      plugin: chatMessage.message.plugin || PluginID.NONE,
      rag_used: chatMessage.message.rag_used,
      rag_id: chatMessage.message.rag_id,
    };
    const newFeedback = await createMessageFeedback(feedbackInsert);
    setChatMessages((prevMessages: ChatMessage[]) =>
      prevMessages.map((message: ChatMessage) =>
        message.message.id === chatMessage.message.id
          ? { ...message, feedback: newFeedback[0] }
          : message,
      ),
    );
  };

  const handleSendContinuation = async () => {
    await handleSendMessage(null, chatMessages, false, true);
  };

  const handleSendTerminalContinuation = async () => {
    await handleSendMessage(
      null,
      chatMessages,
      false,
      true,
      undefined,
      undefined,
      true,
    );
  };

  const handleSendConfirmTerminalCommand = async (editedCommand?: string) => {
    const updatedMessages = [...chatMessages];
    const lastMessage = updatedMessages[updatedMessages.length - 1];
    if (!lastMessage) return;

    // Only process command editing if editedCommand is provided
    if (editedCommand?.trim()) {
      // Find all terminal-command tags and get the last one
      const terminalCommandRegex =
        /<terminal-command[^>]*>([^<]*)<\/terminal-command>/g;
      const matches = [
        ...lastMessage.message.content.matchAll(terminalCommandRegex),
      ];
      if (!matches.length) return;

      const lastMatch = matches[matches.length - 1];
      const fullMatch = lastMatch[0];
      const execDir = fullMatch.match(/exec-dir="([^"]*)"/)?.[1] || '/';

      // Replace only the last occurrence
      const parts = lastMessage.message.content.split(fullMatch);
      parts[parts.length - 1] = parts[parts.length - 1] || '';
      lastMessage.message.content = `${parts.slice(0, -1).join(fullMatch)}<terminal-command exec-dir="${execDir}">${editedCommand}</terminal-command>${parts[parts.length - 1]}`;
    }

    await handleSendMessage(
      null,
      updatedMessages,
      false,
      true,
      undefined,
      undefined,
      false,
      true,
    );
  };

  const getStoredAutoRunPreference = () => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('agentMode') ||
        'ask-every-time') as AgentMode;
    }
    return 'ask-every-time';
  };

  const handleSendMessage = async (
    messageContent: string | null,
    chatMessages: ChatMessage[],
    isRegeneration: boolean,
    isContinuation = false,
    editSequenceNumber?: number,
    model?: ModelWithWebSearch,
    isTerminalContinuation = false,
    confirmTerminalCommand = false,
  ) => {
    const isEdit = editSequenceNumber !== undefined;
    const isRagEnabled = selectedPlugin === PluginID.ENHANCED_SEARCH;

    // Simpler model handling
    const baseModel = (model?.split(':')[0] as LLMID) || chatSettings?.model;
    const isWebSearch = model?.includes(':websearch');

    if (isWebSearch) {
      selectedPlugin = PluginID.WEB_SEARCH;
    }

    try {
      if (!isRegeneration) {
        setUserInput('');
      }

      if (isContinuation) {
        setFirstTokenReceived(true);
      }
      setIsGenerating(true);
      setNewMessageImages([]);

      const newAbortController = new AbortController();
      setAbortController(newAbortController);

      const modelData = [...LLM_LIST].find((llm) => llm.modelId === baseModel);

      validateChatSettings(
        chatSettings,
        modelData,
        profile,
        isContinuation,
        messageContent,
      );

      if (chatSettings && !isRegeneration) {
        setChatSettings((prevSettings) => ({
          ...prevSettings,
          model: baseModel,
        }));
      }

      let currentChat = selectedChat ? { ...selectedChat } : null;

      const b64Images = newMessageImages.map((image) => image.base64);

      const { tempUserChatMessage, tempAssistantChatMessage } =
        createTempMessages({
          messageContent,
          chatMessages,
          b64Images,
          isContinuation,
          selectedPlugin,
          model: baseModel,
        });

      let sentChatMessages = isTemporaryChat
        ? [...temporaryChatMessages]
        : [...chatMessages];

      // If the message is an edit, remove all following messages
      if (isEdit) {
        sentChatMessages = sentChatMessages.filter(
          (chatMessage) =>
            chatMessage.message.sequence_number < editSequenceNumber,
        );
      }

      let lastMessageRetrievedFileItems: Tables<'file_items'>[] | null = null;
      let editedMessageFiles: Tables<'files'>[] | null = null;

      if (isContinuation || isRegeneration) {
        // If is continuation or regeneration, get the last message's file items so we don't have to run the retrieval logic
        const messageFileItems = await getMessageFileItemsByMessageId(
          sentChatMessages[sentChatMessages.length - 1].message.id,
        );

        lastMessageRetrievedFileItems =
          messageFileItems.file_items.sort((a, b) => {
            // First sort by file_id
            if (a.file_id < b.file_id) return -1;
            if (a.file_id > b.file_id) return 1;

            // Then sort by sequence_number if file_ids are equal
            return a.sequence_number - b.sequence_number;
          }) ?? [];
      }

      if (isEdit) {
        // If is edit, get the edited message's file items so we can tell the agent which file is attached to the edited message
        const editedChatMessage = chatMessages.find(
          (msg) => msg.message.sequence_number === editSequenceNumber,
        );
        editedMessageFiles = chatFiles.filter(
          (file) => file.message_id === editedChatMessage?.message.id,
        );
      }

      if (isRegeneration) {
        sentChatMessages.pop();
        sentChatMessages.push(tempAssistantChatMessage);
      } else {
        sentChatMessages.push(tempUserChatMessage);
        if (!isContinuation) sentChatMessages.push(tempAssistantChatMessage);
      }

      // Update the UI with the new messages except for continuations
      if (!isContinuation) {
        if (isTemporaryChat) {
          setTemporaryChatMessages(sentChatMessages);
        } else {
          setChatMessages(sentChatMessages);
        }
      }

      let retrievedFileItems: Tables<'file_items'>[] = [];

      if (
        (newMessageFiles.length > 0 || chatFiles.length > 0) &&
        useRetrieval
      ) {
        setToolInUse('retrieval');

        if (!isContinuation) {
          retrievedFileItems = await retrievalLogic(
            sentChatMessages,
            editedMessageFiles,
            chatFiles,
            sourceCount,
          );
        } else {
          // Get the last message's retrieved file items
          retrievedFileItems = lastMessageRetrievedFileItems ?? [];
        }
      }

      const payload: ChatPayload = {
        chatMessages: sentChatMessages,
        retrievedFileItems: retrievedFileItems,
      };
      const modelParams: ModelParams = {
        isContinuation,
        isTerminalContinuation,
        isRagEnabled,
        selectedPlugin,
        agentMode: getStoredAutoRunPreference(),
        confirmTerminalCommand,
      };
      const chatId = currentChat?.id ?? uuidv4();
      const chatMetadata: ChatMetadata = { id: chatId, newChat: !currentChat };

      let generatedText = '';
      let thinkingText = '';
      let thinkingElapsedSecs: number | null = null;
      let finishReason = '';
      let ragUsed = false;
      let ragId = null;
      let citations: string[] = [];

      const {
        fullText,
        thinkingText: thinkingTextFromResponse,
        thinkingElapsedSecs: thinkingElapsedSecsFromResponse,
        finishReason: finishReasonFromResponse,
        ragUsed: ragUsedFromResponse,
        ragId: ragIdFromResponse,
        selectedPlugin: updatedSelectedPlugin,
        citations: citationsFromResponse,
        chatTitle,
      } = await handleHostedChat(
        payload,
        tempAssistantChatMessage,
        isRegeneration,
        newAbortController,
        chatImages,
        setIsGenerating,
        setFirstTokenReceived,
        isTemporaryChat ? setTemporaryChatMessages : setChatMessages,
        setToolInUse,
        alertDispatch,
        setAgentStatus,
        baseModel,
        modelParams,
        chatMetadata,
      );
      generatedText = fullText;
      thinkingText = thinkingTextFromResponse;
      thinkingElapsedSecs = thinkingElapsedSecsFromResponse;
      finishReason = finishReasonFromResponse;
      ragUsed = ragUsedFromResponse;
      ragId = ragIdFromResponse;
      selectedPlugin = updatedSelectedPlugin;
      citations = citationsFromResponse;

      if (isTemporaryChat) {
        // Update temporary chat messages with the generated response
        const updatedMessages = sentChatMessages.map((msg) =>
          msg.message.id === tempAssistantChatMessage.message.id
            ? {
                ...msg,
                message: {
                  ...msg.message,
                  content: generatedText,
                  thinking_content: thinkingText,
                  thinking_enabled: !!thinkingText,
                  thinking_elapsed_secs: thinkingElapsedSecs,
                  citations: citations || [],
                },
              }
            : msg,
        );
        setTemporaryChatMessages(updatedMessages);
      } else {
        if (!currentChat) {
          currentChat = await handleCreateChat(
            baseModel!,
            profile!,
            messageContent || '',
            finishReason,
            setSelectedChat,
            setChats,
            chatId,
            chatTitle,
          );

          // Update URL without triggering a page reload or new history entry
          window.history.replaceState({}, '', `/c/${chatId}`);
        } else {
          const updatedChat = {
            ...currentChat,
            updated_at: new Date().toISOString(),
            finish_reason: finishReason,
            model: chatSettings?.model || currentChat.model,
          };

          setChats((prevChats) => {
            const updatedChats = prevChats.map((prevChat) =>
              prevChat.id === updatedChat.id ? updatedChat : prevChat,
            );

            return updatedChats;
          });

          if (selectedChat?.id === updatedChat.id) {
            setSelectedChat(updatedChat);
          }
        }

        await handleCreateMessages(
          chatMessages,
          currentChat,
          profile!,
          modelData!,
          messageContent,
          generatedText,
          newMessageImages,
          isRegeneration,
          isContinuation,
          retrievedFileItems,
          setChatMessages,
          setChatImages,
          selectedPlugin,
          editSequenceNumber,
          ragUsed,
          ragId,
          isTemporaryChat,
          citations,
          thinkingText,
          thinkingElapsedSecs,
          newMessageFiles,
          setChatFiles,
        );
      }

      setToolInUse('none');
      setIsGenerating(false);
      setFirstTokenReceived(false);
      setAgentStatus(null);
    } catch (error) {
      setToolInUse('none');
      setIsGenerating(false);
      setFirstTokenReceived(false);
      setAgentStatus(null);
    }
  };

  const handleSendEdit = async (
    editedContent: string,
    sequenceNumber: number,
  ) => {
    if (!selectedChat) return;

    handleSendMessage(
      editedContent,
      chatMessages,
      false,
      false,
      sequenceNumber,
    );
  };

  return {
    chatInputRef,
    handleNewChat,
    handleSendMessage,
    handleFocusChatInput,
    handleStopMessage,
    handleSendContinuation,
    handleSendTerminalContinuation,
    handleSendConfirmTerminalCommand,
    handleSendEdit,
    handleSendFeedback,
    handleSelectChat,
  };
};

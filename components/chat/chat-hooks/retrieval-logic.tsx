import type { ChatMessage } from '@/types';
import type { Tables } from '@/supabase/types';
import { PentestGPTContext } from '@/context/context';
import { useContext } from 'react';
import { getFileItemsByFileIds, getFileItemsByFileId } from '@/db/files';

const MAX_FILE_CONTENT_TOKENS = 12000;

/**
 * Retrieval Logic for File Content
 *
 * This module handles two approaches to file content retrieval:
 * 1. Direct retrieval - For small files under the token limit, bypasses the AI agent
 * 2. Agent-based retrieval - For larger files, uses an AI agent to select relevant chunks
 *
 * The decision is based on the total token count of all files to be processed.
 *
 * @param messages - Chat messages for context
 * @param editedMessageFiles - Files from edited messages
 * @param existingFiles - Files already in the chat
 * @param sourceCount - Number of sources to retrieve
 * @returns Array of file items to be included in the context
 */

// Create a custom hook
export const useRetrievalLogic = () => {
  // Move the useContext inside the hook
  const {
    chatFiles,
    selectedChat,
    setChatFiles,
    setNewMessageFiles,
    newMessageFiles,
  } = useContext(PentestGPTContext);

  const rehydrateRetrievedFileItems = async (
    retrievedFileItemsData: Tables<'file_items'>[] | null,
  ) => {
    let retrievedFileItems = retrievedFileItemsData ?? [];

    const retrievedChatFiles = chatFiles.filter((file) =>
      retrievedFileItems.some((item) => item.file_id === file.id),
    );

    const retrievedNewMessageFiles = newMessageFiles.filter((file) =>
      retrievedFileItems.some((item) => item.file_id === file.id),
    );

    const sumOfNewMessageFilesTokens = retrievedNewMessageFiles.reduce(
      (acc, file) => acc + file.tokens,
      0,
    );

    const sumOfChatFilesTokens = retrievedChatFiles.reduce(
      (acc, file) => acc + file.tokens,
      0,
    );

    const sumOfTokens = sumOfNewMessageFilesTokens + sumOfChatFilesTokens;

    // Log token summary in a cleaner format
    console.log(
      `Token usage: ${sumOfTokens}/${MAX_FILE_CONTENT_TOKENS} (new: ${sumOfNewMessageFilesTokens}, existing: ${sumOfChatFilesTokens})`,
    );

    if (sumOfTokens > MAX_FILE_CONTENT_TOKENS) {
      if (
        sumOfNewMessageFilesTokens > 0 &&
        sumOfNewMessageFilesTokens < MAX_FILE_CONTENT_TOKENS
      ) {
        console.log(
          `Strategy: Including all new message files (${sumOfNewMessageFilesTokens} tokens)`,
        );
        const allNewMessageFileItems = await getFileItemsByFileIds(
          retrievedNewMessageFiles.map((file) => file.id),
        );
        retrievedFileItems.push(...(allNewMessageFileItems ?? []));
      } else {
        console.log(
          `Strategy: Using only AI-selected chunks (token limit exceeded)`,
        );
      }
    } else {
      console.log(
        `Strategy: Including all file content (${sumOfTokens} tokens)`,
      );
      const allNewMessageFileItems = await getFileItemsByFileIds([
        ...retrievedNewMessageFiles.map((file) => file.id),
        ...retrievedChatFiles.map((file) => file.id),
      ]);
      retrievedFileItems.push(...(allNewMessageFileItems ?? []));
    }

    // remove duplicates
    retrievedFileItems = retrievedFileItems.filter(
      (item, index, self) => index === self.findIndex((t) => t.id === item.id),
    );

    // sort by file_id and sequence_number
    return retrievedFileItems.sort((a, b) => {
      if (a.file_id !== b.file_id) {
        return a.file_id < b.file_id ? -1 : 1;
      }
      return a.sequence_number - b.sequence_number;
    });
  };

  const retrievalLogic = async (
    messages: ChatMessage[],
    editedMessageFiles: Tables<'files'>[] | null,
    existingFiles: Tables<'files'>[],
    sourceCount: number,
  ) => {
    // Get all files that need to be processed
    const filesToProcess = [...(editedMessageFiles || []), ...newMessageFiles];

    // Process each file separately to maintain proper ordering
    let allFileItems: Tables<'file_items'>[] = [];

    // Process files in batches to avoid too many parallel requests
    const BATCH_SIZE = 5;
    for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
      const batch = filesToProcess.slice(i, i + BATCH_SIZE);

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (file) => {
          try {
            const data = await getFileItemsByFileId(file.id);
            return data;
          } catch (e) {
            console.error(`Unexpected error retrieving file ${file.id}:`, e);
            return [];
          }
        }),
      );

      // Combine results
      allFileItems = [...allFileItems, ...batchResults.flat()];
    }

    // Log result summary
    console.log(`Retrieved ${allFileItems.length} file items directly`);

    // Update chat files
    setChatFiles([
      ...existingFiles,
      ...newMessageFiles.map((file) => ({
        ...file,
        chat_id: selectedChat?.id ?? null,
        message_id: messages[messages.length - 2].message.id,
      })),
    ]);
    setNewMessageFiles([]);

    // Sort by file_id to ensure consistent ordering between files
    return allFileItems.sort((a, b) => {
      if (a.file_id !== b.file_id) {
        return a.file_id < b.file_id ? -1 : 1;
      }
      return 0; // sequence_number already sorted by database
    });
  };

  // Return the function so it can be used by other components
  return { retrievalLogic };
};

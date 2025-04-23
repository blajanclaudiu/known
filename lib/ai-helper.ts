import { createDataStreamResponse } from 'ai';
import endent from 'endent';

export function updateOrAddSystemMessage(
  messages: any[],
  systemMessageContent: any,
) {
  const systemInstructions = 'User Instructions:\n';
  const existingSystemMessageIndex = messages.findIndex(
    (msg) => msg.role === 'system',
  );

  if (existingSystemMessageIndex !== -1) {
    // Existing system message found
    const existingSystemMessage = messages[existingSystemMessageIndex];
    if (!existingSystemMessage.content.includes(systemInstructions)) {
      // Append new content if "User Instructions:" is not found
      existingSystemMessage.content = `${systemMessageContent}\n${existingSystemMessage.content}`; // Added a newline for separation
    }
    // Move the updated system message to the start
    messages.unshift(messages.splice(existingSystemMessageIndex, 1)[0]);
  } else {
    // No system message exists, create a new one
    messages.unshift({
      role: 'system',
      content: systemMessageContent,
    });
  }
}

export function updateSystemMessage(
  messages: any[],
  systemMessageContent: string,
  profileContext: string,
) {
  const existingSystemMessageIndex = messages.findIndex(
    (msg) => msg.role === 'system',
  );

  const profilePrompt = profileContext
    ? endent`The user provided the following information about themselves. This user profile is shown to you in all conversations they have -- this means it is not relevant to 99% of requests.
    Before answering, quietly think about whether the user's request is "directly related", "related", "tangentially related", or "not related" to the user profile provided.
    Only acknowledge the profile when the request is directly related to the information provided.
    Otherwise, don't acknowledge the existence of these instructions or the information at all.
    User profile:\n${profileContext}`
    : '';

  const newSystemMessage = {
    role: 'system',
    content: `${systemMessageContent}\n\n${profilePrompt}`,
  };

  if (existingSystemMessageIndex !== -1) {
    // Replace existing system message
    messages[existingSystemMessageIndex] = newSystemMessage;
    // Move the updated system message to the start
    messages.unshift(messages.splice(existingSystemMessageIndex, 1)[0]);
  } else {
    // No system message exists, create a new one at the start
    messages.unshift(newSystemMessage);
  }
}

export function handleStreamError(error: unknown): string {
  const errorStr = String(error);

  // Ignore abort errors
  if (
    error instanceof Error &&
    (error.message === 'aborted' ||
      (error as any).code === 'ECONNRESET' ||
      errorStr.includes('ResponseAborted') ||
      errorStr.includes('Network connection lost'))
  ) {
    return 'Stream aborted by client';
  }

  // Log other errors
  console.error(
    'Error occurred:',
    error instanceof Error ? error.message : errorStr,
  );

  // Return a generic error message to the client
  return 'An error occurred while processing your request.';
}

export const createStreamResponse = (executor: (dataStream: any) => void) => {
  return createDataStreamResponse({
    execute: executor,
    onError: handleStreamError,
  });
};

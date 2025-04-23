import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from './types';

/**
 * Creates a tool for sending messages to the user without requiring a response
 * @param context - The context needed for tool execution
 * @returns The message notification tool
 */
export const createMessageNotifyTool = (context: ToolContext) => {
  const { dataStream } = context;

  return tool({
    description: `Send a message to user without requiring a response. Use for acknowledging receipt of messages, providing progress updates, reporting task completion, or explaining changes in approach.`,
    parameters: z.object({
      text: z.string().describe('Message text to display to user'),
    }),
    execute: async ({ text }) => {
      dataStream.writeData({
        type: 'agent-status',
        content: 'message_notify_user',
      });

      dataStream.writeData({
        type: 'text-delta',
        content: `${text}\n\n`,
      });

      return text;
    },
  });
};

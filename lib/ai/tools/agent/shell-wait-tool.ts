import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from './types';

const MAX_WAIT_TIME = 4 * 60 * 1000; // 4 minutes in milliseconds

/**
 * Creates a tool for waiting on shell processes
 * @param context - The context needed for tool execution
 * @returns The shell wait tool
 */
export const createShellWaitTool = (context: ToolContext) => {
  const { dataStream } = context;

  return tool({
    description:
      'Wait for the running process in a specified shell session to return. Use after running commands that require longer runtime.',
    parameters: z.object({
      seconds: z.number().optional().describe('Wait duration in seconds'),
    }),
    execute: async (args) => {
      const { seconds = 60 } = args;

      // Validate wait time
      const waitTimeMs = seconds * 1000;
      if (waitTimeMs > MAX_WAIT_TIME) {
        const errorMessage = `Error: Maximum wait time is ${MAX_WAIT_TIME / 1000} seconds`;
        dataStream.writeData({
          type: 'text-delta',
          content: errorMessage,
        });
        return errorMessage;
      }

      dataStream.writeData({
        type: 'agent-status',
        content: 'shell_wait',
      });

      dataStream.writeData({
        type: 'text-delta',
        content: `<shell-wait>${seconds} seconds</shell-wait>`,
      });

      // Wait for specified duration
      const startTime = Date.now();
      const endTime = startTime + waitTimeMs;

      while (Date.now() < endTime) {
        const remainingTime = Math.ceil((endTime - Date.now()) / 1000);
        dataStream.writeData({
          type: 'shell-wait',
          content: `${remainingTime} seconds remaining`,
        });

        // Wait for 15 seconds or until the end time
        const nextUpdate = Math.min(15000, endTime - Date.now());
        if (nextUpdate > 0) {
          await new Promise((resolve) => setTimeout(resolve, nextUpdate));
        }
      }

      return `Waited for ${seconds} seconds`;
    },
  });
};

import { tool } from 'ai';
import { z } from 'zod';

/**
 * Creates a special tool to indicate the agent has completed all tasks and is about to enter idle state
 * @returns The idle tool
 */
export const createIdleTool = () => {
  return tool({
    description:
      'A special tool to indicate you have completed all tasks and are about to enter idle state.',
    parameters: z.object({}),
    // no execute function - invoking it will terminate the agent
  });
};

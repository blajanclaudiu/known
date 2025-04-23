import { tool } from 'ai';
import { z } from 'zod';

/**
 * Creates a terminal tool for executing commands in the sandbox environment with user confirmation
 * @param context - The context needed for tool execution
 * @returns The terminal tool
 */
export const createAskShellExecTool = () => {
  return tool({
    description:
      'Execute commands in the sandbox environment with user confirmation. Use for running code, installing packages, or managing files.',
    parameters: z.object({
      exec_dir: z
        .string()
        .describe(
          'Working directory for command execution (must use absolute path)',
        ),
      command: z.string().describe('Shell command to execute'),
    }),
  });
};

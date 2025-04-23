import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from './types';
import {
  handleFileError,
  ensureSandboxConnection,
} from './utils/sandbox-utils';
import { truncateContentByTokens } from '@/lib/ai/terminal-utils';

const processFileContent = (
  content: string,
  start_line?: number,
  end_line?: number,
): string => {
  if (typeof start_line === 'number' || typeof end_line === 'number') {
    const lines = content.split('\n');
    const start = start_line ?? 0;
    const end = end_line ?? lines.length;
    return lines.slice(start, end).join('\n');
  }
  return content;
};

const readAndProcessFile = async (
  sandbox: any,
  dataStream: any,
  filePath: string,
  start_line?: number,
  end_line?: number,
): Promise<string> => {
  try {
    dataStream.writeData({
      type: 'agent-status',
      content: 'file_read',
    });

    const content = await sandbox.files.read(filePath);
    const processedContent = processFileContent(content, start_line, end_line);
    const wrappedContent = `<file-content path="${filePath}">${truncateContentByTokens(processedContent, 2048)}</file-content>\n\n`;

    dataStream.writeData({
      type: 'text-delta',
      content: wrappedContent,
    });

    return truncateContentByTokens(processedContent);
  } catch (error) {
    return handleFileError(error, 'processing file');
  }
};

/**
 * Creates a tool for reading content from a file in the sandbox
 * @param context - The context needed for tool execution
 * @returns The file read tool
 */
export const createFileReadTool = (context: ToolContext) => {
  const {
    dataStream,
    sandbox: initialSandbox,
    userID,
    persistentSandbox: initialPersistentSandbox = true,
    setSandbox,
    isPremiumUser,
  } = context;

  return tool({
    description:
      'Read file content from the sandbox. Use for checking file contents, analyzing logs, or reading configuration files.',
    parameters: z.object({
      file: z.string().describe('Absolute path of the file to read'),
      start_line: z
        .number()
        .optional()
        .describe('(Optional) Starting line to read from, 0-based'),
      end_line: z
        .number()
        .optional()
        .describe('(Optional) Ending line number (exclusive)'),
    }),
    execute: async (args) => {
      const { file, start_line, end_line } = args as {
        file: string;
        start_line?: number;
        end_line?: number;
      };

      try {
        // Ensure sandbox connection
        const { sandbox } = await ensureSandboxConnection(
          {
            userID,
            dataStream,
            isPremiumUser,
            setSandbox,
          },
          {
            initialSandbox,
            initialPersistentSandbox,
          },
        );

        return readAndProcessFile(
          sandbox,
          dataStream,
          file,
          start_line,
          end_line,
        );
      } catch (error) {
        return handleFileError(error, 'connecting to sandbox');
      }
    },
  });
};

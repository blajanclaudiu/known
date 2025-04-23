import PostHogClient from '@/app/posthog';
import { executeTerminalCommand } from '@/lib/tools/e2b/terminal-executor';
import { streamTerminalOutput } from '@/lib/ai/terminal-utils';
import type { Sandbox } from '@e2b/code-interpreter';
import { ensureSandboxConnection } from './agent/utils/sandbox-utils';

interface TerminalCommandExecutorConfig {
  userID: string;
  dataStream: any;
  isPremiumUser: boolean;
  setSandbox: (sandbox: Sandbox) => void;
  initialSandbox?: Sandbox;
  initialPersistentSandbox?: boolean;
  messages: any[];
}

export async function executeTerminalCommandWithConfig({
  userID,
  dataStream,
  isPremiumUser,
  setSandbox,
  initialSandbox,
  initialPersistentSandbox,
  messages,
}: TerminalCommandExecutorConfig) {
  const lastAssistantMessageContent = messages[messages.length - 2]?.content;
  const isConfirmedCommand =
    lastAssistantMessageContent?.includes('<terminal-command');

  if (!isConfirmedCommand) {
    return { messages, output: null };
  }

  const confirmedCommandRegex =
    /<terminal-command(?:\s+exec-dir="([^"]*)")?>([\s\S]*?)<\/terminal-command>/g;

  const matches = Array.from(
    lastAssistantMessageContent.matchAll(confirmedCommandRegex),
  );
  const lastMatch = matches[matches.length - 1] as RegExpMatchArray | undefined;

  if (!lastMatch) {
    return { messages, output: null };
  }

  const [, exec_dir, command] = lastMatch;

  const { sandbox, persistentSandbox } = await ensureSandboxConnection(
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

  const posthog = PostHogClient();
  if (posthog) {
    posthog.capture({
      distinctId: userID,
      event: 'terminal_executed',
      properties: {
        command: command,
        persistentSandbox: persistentSandbox,
      },
    });
  }

  dataStream.writeData({
    type: 'agent-status',
    content: 'terminal',
  });

  const terminalStream = await executeTerminalCommand({
    userID,
    command,
    exec_dir,
    sandbox,
  });

  const terminalOutput = await streamTerminalOutput(terminalStream, dataStream);

  const updatedMessages = [...messages];
  const lastMessage = updatedMessages[updatedMessages.length - 1];
  if (lastMessage) {
    lastMessage.content = `${lastMessage.content || ''}\n\n${terminalOutput}`;
  }

  return { messages: updatedMessages };
}

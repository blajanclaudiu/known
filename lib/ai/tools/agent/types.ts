import type { Sandbox } from '@e2b/code-interpreter';
import type { AgentMode } from '@/types/llms';

/**
 * Interface for tools that need access to the data stream
 */
export interface ToolContext {
  dataStream: any;
  sandbox?: Sandbox | null;
  userID: string;
  persistentSandbox?: boolean;
  setSandbox?: (sandbox: Sandbox) => void;
  isPremiumUser?: boolean;
  agentMode: AgentMode;
}

// Constants for sandbox creation
export const SANDBOX_TEMPLATE = 'terminal-agent-sandbox';
export const BASH_SANDBOX_TIMEOUT = 15 * 60 * 1000;

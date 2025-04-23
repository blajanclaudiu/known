import type { ModelProvider } from './models';
import type { PluginID } from './plugins';

export const VALID_MODEL_IDS = [
  'gpt-4-turbo-preview',
  'mistral-medium',
  'mistral-large',
] as const;

export type LLMID = (typeof VALID_MODEL_IDS)[number];

export interface LLM {
  modelId: LLMID;
  modelName: string;
  provider: ModelProvider;
  imageInput: boolean;
  shortModelName?: string;
}

export type ModelWithWebSearch = LLMID | `${LLMID}:websearch`;

export type AgentMode = 'auto-run' | 'ask-every-time';

export interface ModelParams {
  isContinuation: boolean;
  isTerminalContinuation: boolean;
  isRagEnabled: boolean;
  selectedPlugin: PluginID;
  agentMode: AgentMode;
  confirmTerminalCommand: boolean;
}

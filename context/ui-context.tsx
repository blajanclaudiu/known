import { PluginID } from '@/types/plugins';
import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useContext,
} from 'react';
import type { AgentStatusState } from '@/components/messages/agent-status';

interface UIContextType {
  // Tools
  selectedPluginType: string;
  setSelectedPluginType: Dispatch<SetStateAction<string>>;
  selectedPlugin: PluginID;
  setSelectedPlugin: Dispatch<SetStateAction<PluginID>>;

  // CHAT INPUT COMMAND
  slashCommand: string;
  setSlashCommand: Dispatch<SetStateAction<string>>;

  // UI States
  isMobile: boolean;
  isReadyToChat: boolean;
  setIsReadyToChat: Dispatch<SetStateAction<boolean>>;
  showSidebar: boolean;
  setShowSidebar: (value: boolean | ((prevState: boolean) => boolean)) => void;
  showTerminalOutput: boolean;
  setShowTerminalOutput: (
    value: boolean | ((prevState: boolean) => boolean),
  ) => void;

  // Tools UI
  isToolPickerOpen: boolean;
  setIsToolPickerOpen: Dispatch<SetStateAction<boolean>>;
  focusTool: boolean;
  setFocusTool: Dispatch<SetStateAction<boolean>>;
  toolInUse: string;
  setToolInUse: Dispatch<SetStateAction<string>>;

  // Agent states
  agentStatus: AgentStatusState | null;
  setAgentStatus: Dispatch<SetStateAction<AgentStatusState | null>>;

  // Loading States
  isGenerating: boolean;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  firstTokenReceived: boolean;
  setFirstTokenReceived: Dispatch<SetStateAction<boolean>>;
}

export const UIContext = createContext<UIContextType>({
  // Tools
  selectedPluginType: '',
  setSelectedPluginType: () => {},
  selectedPlugin: PluginID.NONE,
  setSelectedPlugin: () => {},

  // CHAT INPUT COMMAND
  slashCommand: '',
  setSlashCommand: () => {},

  // UI States
  isMobile: false,
  isReadyToChat: false,
  setIsReadyToChat: () => {},
  showSidebar: false,
  setShowSidebar: () => {},
  showTerminalOutput: false,
  setShowTerminalOutput: () => {},

  // Tools UI
  isToolPickerOpen: false,
  setIsToolPickerOpen: () => {},
  focusTool: false,
  setFocusTool: () => {},
  toolInUse: 'none',
  setToolInUse: () => {},

  // Agent states
  agentStatus: null,
  setAgentStatus: () => {},

  // Loading States
  isGenerating: false,
  setIsGenerating: () => {},
  firstTokenReceived: false,
  setFirstTokenReceived: () => {},
});

export const useUIContext = () => useContext(UIContext);

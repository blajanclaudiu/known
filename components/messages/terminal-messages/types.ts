export interface MessageTerminalProps {
  content: string;
  isAssistant: boolean;
  isLastMessage: boolean;
}

export interface TerminalBlock {
  command: string;
  stdout: string;
  error?: string;
  exec_dir?: string;
}

export interface ShellWaitBlock {
  seconds: string;
}

export interface FileContentBlock {
  path: string;
  content: string;
  isWrite?: boolean;
}

export type ContentBlock =
  | {
      type: 'text';
      content: string;
    }
  | {
      type: 'terminal';
      content: TerminalBlock;
    }
  | {
      type: 'shell-wait';
      content: ShellWaitBlock;
    }
  | {
      type: 'file-content';
      content: FileContentBlock;
    };

export interface ShowMoreButtonProps {
  isExpanded: boolean;
  onClick: () => void;
  remainingLines: number;
}

export const MAX_VISIBLE_LINES = 12;
export const COMMAND_LENGTH_THRESHOLD = 40; // Threshold for when to switch to full terminal view

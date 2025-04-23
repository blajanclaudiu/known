import React from 'react';
import { MessageMarkdown } from '../message-markdown';
import {
  IconChevronDown,
  IconChevronUp,
  IconTerminal2,
} from '@tabler/icons-react';
import type { PluginID } from '@/types/plugins';
import { allTerminalPlugins } from '../message-type-solver';
import { useUIContext } from '@/context/ui-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CopyButton } from '../message-codeblock';
import {
  type TerminalBlock,
  MAX_VISIBLE_LINES,
  COMMAND_LENGTH_THRESHOLD,
} from './types';
import { ShowMoreButton } from './show-more-button';
import stripAnsi from 'strip-ansi';
import { useContext } from 'react';
import { PentestGPTContext } from '@/context/context';
import { AskTerminalCommandBlock } from './ask-terminal-command-block';

interface TerminalBlockProps {
  block: TerminalBlock;
  index: number;
  isClosed: boolean;
  isExpanded: boolean;
  onToggleBlock: (index: number) => void;
  onToggleExpanded: (index: number) => void;
  totalBlocks: number;
  isLastMessage: boolean;
}

const renderContent = (content: string) => (
  <MessageMarkdown content={content} isAssistant={true} />
);

export const TerminalBlockComponent: React.FC<TerminalBlockProps> = ({
  block,
  index,
  isClosed,
  isExpanded,
  onToggleBlock,
  onToggleExpanded,
  totalBlocks,
  isLastMessage,
}) => {
  const { toolInUse, isMobile, isGenerating } = useUIContext();
  const { selectedChat } = useContext(PentestGPTContext);

  const isAskUser = selectedChat?.finish_reason === 'terminal_command_ask_user';
  const hasOutput = block.stdout || block.error;
  const outputContent = [block.stdout, block.error].filter(Boolean).join('\n');

  const lines = outputContent.split('\n');
  const shouldShowMore = lines.length > MAX_VISIBLE_LINES;
  const displayedContent = isExpanded
    ? outputContent
    : lines.slice(0, MAX_VISIBLE_LINES).join('\n');

  const isLongCommand =
    block.command.length > COMMAND_LENGTH_THRESHOLD || isMobile;
  const showFullTerminalView = isLongCommand;

  const isLastBlock = index === totalBlocks - 1;

  if (isLastMessage && !isGenerating && isAskUser && isLastBlock) {
    return (
      <AskTerminalCommandBlock
        command={block.command}
        execDir={block.exec_dir || '/'}
      />
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border border-border ${index === 1 ? 'mb-3' : 'my-3'}`}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
        <div className="flex items-center flex-1 min-w-0">
          <div
            className={cn('flex items-center shrink-0 mr-2', {
              'animate-pulse':
                isLastBlock &&
                allTerminalPlugins.includes(toolInUse as PluginID),
            })}
          >
            <IconTerminal2 size={16} className="mr-2" />
            <span>Executing command</span>
          </div>
          {!showFullTerminalView && (
            <div className="min-w-0 flex-1">
              <code className="truncate block font-mono text-muted-foreground text-sm">
                {block.command}
              </code>
            </div>
          )}
        </div>
        <div className="flex items-center ml-4">
          {hasOutput && (
            <>
              <CopyButton value={stripAnsi(outputContent)} />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onToggleBlock(index)}
                aria-expanded={!isClosed}
                aria-controls={`terminal-content-${index}`}
              >
                {isClosed ? (
                  <IconChevronDown size={18} />
                ) : (
                  <IconChevronUp size={18} />
                )}
              </Button>
            </>
          )}
        </div>
      </div>
      {!isClosed && (
        <div
          id={`terminal-content-${index}`}
          className="bg-foreground dark:bg-background"
        >
          {showFullTerminalView && (
            <div className="font-mono text-foreground/80">
              {renderContent(
                `\`\`\`stdout\nubuntu@sandbox:${block.exec_dir ? `~${block.exec_dir}` : '~'}$ ${block.command}\n\`\`\``,
              )}
            </div>
          )}
          {block.stdout && (
            <div className="font-mono text-foreground/80">
              {renderContent(
                `\`\`\`stdout\n${shouldShowMore ? displayedContent : block.stdout}\n\`\`\``,
              )}
              {shouldShowMore &&
                block.stdout.split('\n').length > MAX_VISIBLE_LINES && (
                  <ShowMoreButton
                    isExpanded={isExpanded}
                    onClick={() => onToggleExpanded(index)}
                    remainingLines={lines.length - MAX_VISIBLE_LINES}
                  />
                )}
            </div>
          )}
          {block.error && (
            <div className="font-mono text-destructive/90">
              {renderContent(
                `\`\`\`stdout\n${shouldShowMore ? displayedContent : block.error}\n\`\`\``,
              )}
              {shouldShowMore &&
                block.error.split('\n').length > MAX_VISIBLE_LINES && (
                  <ShowMoreButton
                    isExpanded={isExpanded}
                    onClick={() => onToggleExpanded(index)}
                    remainingLines={lines.length - MAX_VISIBLE_LINES}
                  />
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

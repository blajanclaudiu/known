import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MessageMarkdown } from '../message-markdown';
import { useUIContext } from '@/context/ui-context';
import type { MessageTerminalProps } from './types';
import { parseContent } from './content-parser';
import { TerminalBlockComponent } from './terminal-block';
import { FileContentBlockComponent } from './file-content-block';
import { ShellWaitBlockComponent } from './shell-wait-block';

export const MessageTerminal: React.FC<MessageTerminalProps> = ({
  content,
  isAssistant,
  isLastMessage,
}) => {
  const { showTerminalOutput } = useUIContext();
  const contentBlocks = useMemo(() => parseContent(content), [content]);

  const [closedBlocks, setClosedBlocks] = useState(() => new Set<number>());
  const [userInteracted, setUserInteracted] = useState(() => new Set<number>());
  const [expandedOutputs, setExpandedOutputs] = useState(
    () => new Set<number>(),
  );

  useEffect(() => {
    setClosedBlocks((prev) => {
      const newSet = new Set(prev);
      contentBlocks.forEach((_, index) => {
        if (!userInteracted.has(index)) {
          if (!showTerminalOutput) {
            newSet.add(index);
          } else {
            newSet.delete(index);
          }
        }
      });
      return newSet;
    });
  }, [showTerminalOutput, contentBlocks, userInteracted]);

  const toggleBlock = useCallback((index: number) => {
    setUserInteracted((prev) => new Set(prev).add(index));
    setClosedBlocks((prev) => {
      const newSet = new Set(prev);
      newSet.has(index) ? newSet.delete(index) : newSet.add(index);
      return newSet;
    });
  }, []);

  const toggleExpanded = useCallback((index: number) => {
    setExpandedOutputs((prev) => {
      const newSet = new Set(prev);
      newSet.has(index) ? newSet.delete(index) : newSet.add(index);
      return newSet;
    });
  }, []);

  return (
    <div>
      {contentBlocks.map((block, index) => (
        <React.Fragment key={index}>
          {block.type === 'text' ? (
            <MessageMarkdown
              content={block.content as string}
              isAssistant={isAssistant}
            />
          ) : block.type === 'terminal' ? (
            <TerminalBlockComponent
              block={block.content}
              index={index}
              isClosed={closedBlocks.has(index)}
              isExpanded={expandedOutputs.has(index)}
              onToggleBlock={toggleBlock}
              onToggleExpanded={toggleExpanded}
              totalBlocks={contentBlocks.length}
              isLastMessage={isLastMessage}
            />
          ) : block.type === 'shell-wait' ? (
            <ShellWaitBlockComponent block={block.content} />
          ) : (
            <FileContentBlockComponent
              block={block.content}
              index={index}
              isClosed={closedBlocks.has(index)}
              onToggleBlock={toggleBlock}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

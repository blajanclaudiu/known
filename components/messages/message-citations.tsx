import React, { type FC, useMemo } from 'react';
import { MessageMarkdown } from './message-markdown';
import { ReasoningMarkdown } from './reasoning-markdown';
import { CitationDisplay } from './citation-display';

interface MessageCitationsProps {
  content: string;
  citations?: string[];
  isAssistant: boolean;
  reasoningWithCitations?: boolean;
}

export const MessageCitations: FC<MessageCitationsProps> = ({
  content,
  citations = [],
  isAssistant,
  reasoningWithCitations,
}) => {
  const processedContent = useMemo(
    () =>
      citations.length > 0
        ? content.replace(/\[(\d+)\]/g, (match, num) => {
            const index = Number.parseInt(num) - 1;
            return citations[index] ? `[${num}](${citations[index]})` : match;
          })
        : content,
    [content, citations],
  );

  return (
    <div>
      {reasoningWithCitations ? (
        <ReasoningMarkdown content={processedContent} />
      ) : (
        <MessageMarkdown content={processedContent} isAssistant={isAssistant} />
      )}
      <CitationDisplay citations={citations} />
    </div>
  );
};

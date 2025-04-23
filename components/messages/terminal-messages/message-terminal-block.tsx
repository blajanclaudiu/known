import { type FC, memo, useMemo } from 'react';
import chalk from 'chalk';
import AnsiToHtml from 'ansi-to-html';
import DOMPurify from 'isomorphic-dompurify';

interface MessageTerminalBlockProps {
  value: string;
}

const customColors = {
  0: '#000000',
  1: '#FF5555',
  2: '#50FA7B',
  3: '#F1FA8C',
  4: '#BD93F9',
  5: '#FF79C6',
  6: '#8BE9FD',
  7: '#F8F8F2',
};

const converter = new AnsiToHtml({
  fg: '#F8F8F2',
  bg: '#282A36',
  colors: customColors,
  newline: true,
});

export const MessageTerminalBlock: FC<MessageTerminalBlockProps> = memo(
  ({ value }) => {
    const formattedValue = useMemo(() => {
      const styledValue = value
        .replace(/\[(\w+)\]/g, (_, word) => chalk.blue.bold(`[${word}]`))
        .replace(/\b(error|warning)\b/gi, (match) =>
          match.toLowerCase() === 'error'
            ? chalk.red.bold(match)
            : chalk.yellow.bold(match),
        );

      const htmlWithColors = converter.toHtml(styledValue);

      let sanitizedHtml = htmlWithColors;
      sanitizedHtml = DOMPurify.sanitize(htmlWithColors, {
        ALLOWED_TAGS: ['span', 'br'],
        ALLOWED_ATTR: ['style'],
        ADD_ATTR: ['target'],
        KEEP_CONTENT: true,
        ALLOW_DATA_ATTR: false,
      });

      return sanitizedHtml;
    }, [value]);

    return (
      <div className="codeblock relative w-full bg-foreground dark:bg-background font-sans">
        <div
          className="whitespace-pre-wrap break-words p-4 font-mono text-sm text-white"
          style={{ background: 'transparent' }}
          dangerouslySetInnerHTML={{ __html: formattedValue }}
        />
      </div>
    );
  },
);

MessageTerminalBlock.displayName = 'MessageTerminalBlock';

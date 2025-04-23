import React, { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconTerminal2 } from '@tabler/icons-react';
import { useUIContext } from '@/context/ui-context';
import { useAgentModePreference } from './use-auto-run-preference';
import { useChatHandler } from '@/components/chat/chat-hooks/use-chat-handler';
import { TextareaAutosize } from '@/components/ui/textarea-autosize';
import { PentestGPTContext } from '@/context/context';

interface AskTerminalCommandBlockProps {
  command: string;
  execDir: string;
}

export const AskTerminalCommandBlock: React.FC<
  AskTerminalCommandBlockProps
> = ({ command, execDir }) => {
  const { isMobile } = useUIContext();
  const { isPremiumSubscription } = useContext(PentestGPTContext);
  const { agentMode, setAgentMode } = useAgentModePreference();
  const { handleSendConfirmTerminalCommand } = useChatHandler();

  const extractCommand = (content: string) => {
    const matches = [
      ...content.matchAll(
        /<terminal-command[^>]*>([^<]*)<\/terminal-command>/g,
      ),
    ];
    return matches.length ? matches[matches.length - 1][1].trim() : content;
  };
  const [editedCommand, setEditedCommand] = useState(extractCommand(command));

  useEffect(() => {
    setEditedCommand(extractCommand(command));
  }, [command]);

  const handleConfirm = () =>
    editedCommand.trim() && handleSendConfirmTerminalCommand(editedCommand);
  const handleKeyDown = (e: React.KeyboardEvent) =>
    e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleConfirm());

  return (
    <div className="overflow-hidden rounded-lg border border-border my-3">
      <div className="flex flex-col border-b border-border bg-muted px-4 py-2">
        <div className="flex items-center text-xs text-muted-foreground mb-1">
          <IconTerminal2 size={16} className="mr-2" />
          <span>{execDir}</span>
        </div>
        <div className="text-sm">
          <TextareaAutosize
            value={editedCommand}
            onValueChange={(value) =>
              isPremiumSubscription && setEditedCommand(value)
            }
            onKeyDown={handleKeyDown}
            className="font-mono text-foreground/80 break-all whitespace-pre-wrap bg-transparent border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            minRows={1}
            maxRows={10}
            disabled={!isPremiumSubscription}
          />
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2 bg-muted">
        {!isMobile && (
          <Select value={agentMode} onValueChange={setAgentMode}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue placeholder="Ask every time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ask-every-time">Ask every time</SelectItem>
              <SelectItem value="auto-run">Auto run</SelectItem>
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="default"
            size="sm"
            className="h-8"
            onClick={handleConfirm}
          >
            Run command
          </Button>
        </div>
      </div>
    </div>
  );
};

import { Button } from '@/components/ui/button';
import { IconPlayerTrackNext } from '@tabler/icons-react';
import type { FC } from 'react';

interface ChatContinueButtonProps {
  isGenerating: boolean;
  finishReason?: string | null;
  onTerminalContinue: () => void;
  onContinue: () => void;
}

export const ChatContinueButton: FC<ChatContinueButtonProps> = ({
  isGenerating,
  finishReason,
  onTerminalContinue,
  onContinue,
}) => {
  if (
    !isGenerating &&
    (finishReason === 'length' || finishReason === 'terminal-calls')
  ) {
    const getButtonText = () => {
      switch (finishReason) {
        case 'terminal-calls':
          return 'Continue';
        case 'length':
          return 'Continue generating';
      }
    };

    return (
      <div className="flex w-full justify-center p-2">
        <Button
          onClick={
            finishReason === 'terminal-calls' ? onTerminalContinue : onContinue
          }
          variant="secondary"
          className="flex items-center space-x-1 px-4 py-2"
        >
          <IconPlayerTrackNext size={16} />
          <span>{getButtonText()}</span>
        </Button>
      </div>
    );
  }

  return null;
};

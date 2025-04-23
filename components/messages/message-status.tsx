import type { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  IconCircleDashed,
  IconCircleCheck,
  IconPlayerPause,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

type MessageStatusProps = {
  finish_reason?: string | null;
};

const isValidFinishReason = (
  reason: string | null | undefined,
): reason is 'message_ask_user' | 'idle' | 'aborted' => {
  return (
    reason === 'message_ask_user' || reason === 'idle' || reason === 'aborted'
  );
};

export const MessageStatus: FC<MessageStatusProps> = ({ finish_reason }) => {
  if (!finish_reason || !isValidFinishReason(finish_reason)) return null;

  const statusConfig = {
    message_ask_user: {
      icon: IconCircleDashed,
      text: 'PentestGPT will continue working after your reply',
      color: 'var(--function-warning)',
      bgClass: 'bg-[var(--function-warning)]/10',
    },
    idle: {
      icon: IconCircleCheck,
      text: 'PentestGPT has completed the current task',
      color: 'var(--function-success)',
      bgClass: 'bg-[var(--function-success)]/10',
    },
    aborted: {
      icon: IconPlayerPause,
      text: 'PentestGPT has stopped, send a new message to continue',
      color: 'var(--function-warning)',
      bgClass: 'bg-[var(--function-warning)]/10',
    },
  };

  const { icon: Icon, text, color, bgClass } = statusConfig[finish_reason];

  return (
    <div className="relative mb-4 flex justify-start">
      <Badge
        variant="outline"
        className={cn(
          'rounded-full border-0 px-3 py-1.5 text-sm max-w-full',
          'whitespace-normal break-words',
          bgClass,
        )}
        style={{ color }}
      >
        <Icon className="mr-1 shrink-0" style={{ color }} />
        <span className="break-words">{text}</span>
      </Badge>
    </div>
  );
};

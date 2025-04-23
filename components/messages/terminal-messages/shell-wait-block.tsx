import React from 'react';
import { IconClock } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface ShellWaitBlockProps {
  block: {
    seconds: string;
  };
}

export const ShellWaitBlockComponent: React.FC<ShellWaitBlockProps> = ({
  block,
}) => {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border my-3')}>
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
        <div className="flex items-center flex-1 min-w-0">
          <div className="flex items-center shrink-0 mr-2">
            <IconClock size={16} className="mr-2" />
            <span>Waiting for terminal</span>
          </div>
          <div className="min-w-0 flex-1">
            <code className="truncate block font-mono text-muted-foreground text-sm">
              {block.seconds}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

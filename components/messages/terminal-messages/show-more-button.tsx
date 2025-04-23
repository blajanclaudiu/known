import React from 'react';
import { Button } from '@/components/ui/button';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';
import type { ShowMoreButtonProps } from './types';

export const ShowMoreButton: React.FC<ShowMoreButtonProps> = ({
  isExpanded,
  onClick,
  remainingLines,
}) => (
  <div className="flex justify-center py-1">
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={onClick}
    >
      {isExpanded ? (
        <>
          <IconArrowUp size={14} className="mr-1" />
          Show Less
        </>
      ) : (
        <>
          <IconArrowDown size={14} className="mr-1" />
          Show More ({remainingLines} more lines)
        </>
      )}
    </Button>
  </div>
);

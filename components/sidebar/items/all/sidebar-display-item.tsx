import { cn } from '@/lib/utils';
import type { ContentType, DataItemType } from '@/types';
import { type FC, useRef, type JSX } from 'react';
import { SidebarUpdateItem } from './sidebar-update-item';

interface SidebarItemProps {
  item: DataItemType;
  isTyping: boolean;
  contentType: ContentType;
  icon: React.ReactNode;
  updateState: any;
  renderInputs: (renderState: any) => JSX.Element;
}

export const SidebarItem: FC<SidebarItemProps> = ({
  item,
  contentType,
  updateState,
  renderInputs,
  icon,
  isTyping,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      itemRef.current?.click();
    }
  };

  return (
    <SidebarUpdateItem
      item={item}
      isTyping={isTyping}
      contentType={contentType}
      updateState={updateState}
      renderInputs={renderInputs}
    >
      <div
        ref={itemRef}
        className={cn(
          'hover:bg-accent flex w-full cursor-pointer items-center rounded p-2 hover:opacity-50 focus:outline-hidden',
        )}
        onKeyDown={handleKeyDown}
      >
        {icon}

        <div className="ml-3 flex-1 truncate text-sm font-semibold">
          {item.name}
        </div>
      </div>
    </SidebarUpdateItem>
  );
};

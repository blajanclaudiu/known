import { useStickToBottom } from 'use-stick-to-bottom';
import { useEffect, useCallback } from 'react';
import { useUIContext } from '@/context/ui-context';

export const useScroll = () => {
  const { isGenerating } = useUIContext();

  const stickToBottom = useStickToBottom({
    resize: 'smooth',
    initial: 'instant',
  });

  const scrollToBottom = useCallback(
    (options?: {
      force?: boolean;
      instant?: boolean;
    }): boolean | Promise<boolean> => {
      if (options?.instant) {
        const scrollContainer = stickToBottom.scrollRef.current;
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
        return true;
      }

      return stickToBottom.scrollToBottom({
        animation: 'smooth',
        preserveScrollPosition: !options?.force,
      });
    },
    [stickToBottom.scrollToBottom, stickToBottom.scrollRef],
  );

  useEffect(() => {
    if (isGenerating) {
      void scrollToBottom();
    }
  }, [isGenerating, scrollToBottom]);

  return {
    scrollRef: stickToBottom.scrollRef,
    contentRef: stickToBottom.contentRef,
    isAtBottom: stickToBottom.isAtBottom,
    scrollToBottom,
    stopScroll: stickToBottom.stopScroll,
  };
};

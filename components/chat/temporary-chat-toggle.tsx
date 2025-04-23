import { useContext, useCallback } from 'react';
import {
  useRouter,
  useSearchParams,
  useParams,
  usePathname,
} from 'next/navigation';
import { IconGhost3, IconGhost3Filled } from '@tabler/icons-react';
import { PentestGPTContext } from '@/context/context';
import { useChatHandler } from './chat-hooks/use-chat-handler';
import { useUIContext } from '@/context/ui-context';
import { Button } from '../ui/button';

export const TemporaryChatToggle = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const pathname = usePathname();
  const { isTemporaryChat } = useContext(PentestGPTContext);
  const { isMobile } = useUIContext();
  const { handleNewChat } = useChatHandler();

  const handleToggleTemporaryChat = useCallback(
    (isTemporary: boolean) => {
      const newSearchParams = new URLSearchParams(searchParams);
      if (isTemporary) {
        if (pathname.includes('/c/')) {
          const baseURL = `/c`;
          newSearchParams.set('temporary-chat', 'true');
          router.push(`${baseURL}?${newSearchParams.toString()}`);
        } else {
          newSearchParams.set('temporary-chat', 'true');
          router.push(`?${newSearchParams.toString()}`);
        }
      } else {
        newSearchParams.delete('temporary-chat');
        router.push(`?${newSearchParams.toString()}`);
        handleNewChat();
      }
    },
    [handleNewChat, searchParams, router, params, pathname],
  );

  if (isMobile) {
    return (
      <Button
        onClick={() => handleToggleTemporaryChat(!isTemporaryChat)}
        variant="ghost"
        className="size-8 rounded-full p-0"
        size="sm"
        aria-label="Toggle temporary chat"
      >
        {isTemporaryChat ? (
          <IconGhost3Filled size={24} />
        ) : (
          <IconGhost3 size={24} />
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={() => handleToggleTemporaryChat(!isTemporaryChat)}
      variant="secondary"
      className="border-secondary-foreground rounded-full border px-4"
      aria-label="Toggle temporary chat"
    >
      <div className="flex w-full items-center justify-center gap-1.5">
        {isTemporaryChat ? (
          <IconGhost3Filled size={20} />
        ) : (
          <IconGhost3 size={20} />
        )}
        <span className="font-normal">Temporary</span>
      </div>
    </Button>
  );
};

import { PentestGPTContext } from '@/context/context';
import { cn } from '@/lib/utils';
import type { Tables } from '@/supabase/types';
import type { ContentType, DataItemType, DataListType } from '@/types';
import {
  type FC,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ChatItem } from './items/chat/chat-item';
import { getMoreChatsByUserId } from '@/db/chats';
import { Loader2 } from 'lucide-react';
import { type DateCategory, sortByDateCategory } from '@/lib/utils';

interface SidebarDataListProps {
  contentType: ContentType;
  data: DataListType;
}

export const SidebarDataList: FC<SidebarDataListProps> = ({
  contentType,
  data,
}) => {
  const { chats, setChats, isTemporaryChat } = useContext(PentestGPTContext);

  const divRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreChats, setHasMoreChats] = useState(true);

  const fetchMoreChats = useCallback(async () => {
    if (
      (contentType === 'chats' || contentType === 'tools') &&
      data.length > 0 &&
      !isLoadingMore &&
      hasMoreChats
    ) {
      setIsLoadingMore(true);
      const lastChat = data[data.length - 1] as Tables<'chats'>;
      const moreChats = await getMoreChatsByUserId(
        lastChat.user_id,
        lastChat.created_at,
      );

      const newChats = moreChats.filter(
        (chat) => !chats.some((c) => c.id === chat.id),
      );

      if (newChats.length > 0) {
        setChats((prevChats: Tables<'chats'>[]) => {
          // Create a map of existing chats by ID for quick lookup
          const existingChatsMap = new Map(
            prevChats.map((chat) => [chat.id, chat]),
          );

          // Filter out any chats that already exist in prevChats
          const uniqueNewChats = moreChats.filter(
            (chat) => !existingChatsMap.has(chat.id),
          );

          // Return combined array with unique chats
          return [...prevChats, ...uniqueNewChats];
        });
      } else {
        setHasMoreChats(false);
      }
      setIsLoadingMore(false);
    }
  }, [contentType, data, isLoadingMore, hasMoreChats, setChats]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 1.0,
    };

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isLoadingMore && hasMoreChats) {
        fetchMoreChats();
      }
    }, options);

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [loaderRef, isLoadingMore, hasMoreChats, fetchMoreChats]);

  const getDataListComponent = (
    contentType: ContentType,
    item: DataItemType,
  ) => {
    switch (contentType) {
      case 'chats':
        return <ChatItem key={item.id} chat={item as Tables<'chats'>} />;
      case 'tools':
        return <ChatItem key={item.id} chat={item as Tables<'chats'>} />;
      default:
        return null;
    }
  };

  const getSortedData = (data: DataItemType[], category: DateCategory) => {
    return sortByDateCategory(data, category);
  };

  return (
    <div
      ref={divRef}
      className={cn(
        'relative flex h-full flex-col',
        isTemporaryChat ? 'overflow-hidden' : 'overflow-auto',
      )}
    >
      {isTemporaryChat && (
        <div className="bg-tertiary/80 pointer-events-auto absolute inset-0 z-50" />
      )}
      <div
        className={cn(
          'relative z-10',
          isTemporaryChat && 'pointer-events-none',
        )}
      >
        {data.length === 0 && (
          <div className="flex grow flex-col items-center justify-center">
            <div className="text-muted-foreground p-8 text-center text-lg italic">
              No {contentType}.
            </div>
          </div>
        )}

        {data.length > 0 && (
          <div className={`size-full space-y-3 pt-4`}>
            {contentType === 'chats' || contentType === 'tools' ? (
              <>
                {[
                  'Today',
                  'Yesterday',
                  'Previous 7 Days',
                  'Previous 30 Days',
                  'Older',
                ].map((dateCategory) => {
                  const sortedData = getSortedData(
                    data,
                    dateCategory as
                      | 'Today'
                      | 'Yesterday'
                      | 'Previous 7 Days'
                      | 'Previous 30 Days'
                      | 'Older',
                  );

                  return (
                    sortedData.length > 0 && (
                      <div key={dateCategory} className="pb-2">
                        <div className="text-muted-foreground bg-tertiary sticky top-0 z-10 mb-1 py-1 pl-2 text-xs font-bold">
                          {dateCategory}
                        </div>

                        <div className={cn('flex grow flex-col')}>
                          {sortedData.map((item: any) => (
                            <div key={item.id}>
                              {getDataListComponent(contentType, item)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  );
                })}
                {(contentType === 'chats' || contentType === 'tools') &&
                  data.length > 0 &&
                  hasMoreChats &&
                  !isTemporaryChat && (
                    <div ref={loaderRef} className="mt-4 flex justify-center">
                      {isLoadingMore && (
                        <Loader2 className="text-primary size-4 animate-spin" />
                      )}
                    </div>
                  )}
              </>
            ) : (
              <div className={cn('flex grow flex-col')}>
                {data.map((item) => (
                  <div key={item.id}>
                    {getDataListComponent(contentType, item)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

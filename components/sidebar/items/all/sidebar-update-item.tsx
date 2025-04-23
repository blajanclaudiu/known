import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { PentestGPTContext } from '@/context/context';
import { updateChat } from '@/db/chats';
import { updateFile } from '@/db/files';
import type { TablesUpdate } from '@/supabase/types';
import type { ContentType, DataItemType } from '@/types';
import {
  type FC,
  useContext,
  useEffect,
  useRef,
  useState,
  type JSX,
} from 'react';
import { toast } from 'sonner';
import { SidebarDeleteItem } from './sidebar-delete-item';

interface SidebarUpdateItemProps {
  isTyping: boolean;
  item: DataItemType;
  contentType: ContentType;
  children: React.ReactNode;
  renderInputs: (renderState: any) => JSX.Element;
  updateState: any;
}

export const SidebarUpdateItem: FC<SidebarUpdateItemProps> = ({
  item,
  contentType,
  children,
  renderInputs,
  updateState,
  isTyping,
}) => {
  const { setChats } = useContext(PentestGPTContext);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const fetchDataFunction = fetchDataFunctions[contentType];
        if (!fetchDataFunction) return;
        await fetchDataFunction(item.id);
      };

      fetchData();
    }
  }, [isOpen]);

  const renderState = {
    chats: null,
    files: null,
    tools: null,
  };

  const fetchDataFunctions: Record<
    ContentType,
    ((id: string) => Promise<void>) | null
  > = {
    chats: null,
    tools: null,
  };

  const updateFunctions = {
    chats: updateChat,
    files: async (fileId: string, updateState: TablesUpdate<'files'>) => {
      const updatedFile = await updateFile(fileId, updateState);
      return updatedFile;
    },
    tools: updateChat,
  };

  const stateUpdateFunctions = {
    chats: setChats,
    tools: setChats,
  };

  const handleUpdate = async () => {
    try {
      const updateFunction = updateFunctions[contentType];
      const setStateFunction = stateUpdateFunctions[contentType];

      if (!updateFunction || !setStateFunction) return;
      if (isTyping) return; // Prevent update while typing

      const updatedItem = await updateFunction(item.id, updateState);

      setStateFunction((prevItems: any) =>
        prevItems.map((prevItem: any) =>
          prevItem.id === item.id ? updatedItem : prevItem,
        ),
      );

      setIsOpen(false);

      toast.success(`${contentType.slice(0, -1)} updated successfully`);
    } catch (error) {
      toast.error(`Error updating ${contentType.slice(0, -1)}. ${error}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isTyping && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      buttonRef.current?.click();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent
        className="flex min-w-[450px] flex-col justify-between"
        side="left"
        onKeyDown={handleKeyDown}
      >
        <div className="grow overflow-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold">
              Edit {contentType.slice(0, -1)}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            {renderInputs(renderState[contentType])}
          </div>
        </div>

        <SheetFooter className="mt-2 flex justify-between">
          <SidebarDeleteItem item={item} contentType={contentType} />

          <div className="flex grow justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>

            <Button ref={buttonRef} onClick={handleUpdate}>
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

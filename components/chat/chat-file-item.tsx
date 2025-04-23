import type { Tables } from '@/supabase/types';
import {
  IconFileFilled,
  IconFileTypeCsv,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypeTxt,
  IconJson,
  IconLoader2,
  IconMarkdown,
  IconX,
} from '@tabler/icons-react';
import type { FC } from 'react';
import { WithTooltip } from '../ui/with-tooltip';

interface FileItemProps {
  file: Tables<'files'>;
  isLoading?: boolean;
  showRemoveButton: boolean;
  onRemove?: (fileId: string) => void;
  onClick?: () => void;
}

export const ChatFileItem: FC<FileItemProps> = ({
  file,
  isLoading,
  showRemoveButton,
  onRemove,
  onClick,
}) => {
  const getFileIcon = () => {
    const fileExtension = file.type?.includes('/')
      ? file.type.split('/')[1]
      : file.type;

    switch (fileExtension) {
      case 'pdf':
        return <IconFileTypePdf />;
      case 'markdown':
        return <IconMarkdown />;
      case 'txt':
        return <IconFileTypeTxt />;
      case 'json':
        return <IconJson />;
      case 'csv':
        return <IconFileTypeCsv />;
      case 'docx':
        return <IconFileTypeDocx />;
      default:
        return <IconFileFilled />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-secondary relative flex h-[64px] items-center space-x-4 rounded-xl px-4 py-3">
        <div className="rounded bg-blue-500 p-2">
          <IconLoader2 className="animate-spin" />
        </div>
        <div className="truncate text-sm">
          <div className="truncate">{file.name}</div>
          <div className="truncate opacity-50">{file.type}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-secondary relative flex h-[64px] cursor-pointer items-center space-x-4 rounded-xl px-4 py-3 hover:opacity-50"
      onClick={onClick}
    >
      <div className="rounded bg-blue-500 p-2">{getFileIcon()}</div>

      <div className="truncate text-sm">
        <div className="truncate">{file.name}</div>
      </div>

      {showRemoveButton && (
        <WithTooltip
          delayDuration={0}
          side="top"
          display={<div>Remove file</div>}
          trigger={
            <IconX
              className="bg-secondary border-primary absolute right-[-6px] top-[-6px] flex size-5 cursor-pointer items-center justify-center rounded-full border text-[10px] hover:border-red-500 hover:bg-white hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.(file.id);
              }}
            />
          }
        />
      )}
    </div>
  );
};

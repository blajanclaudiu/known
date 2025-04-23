import { PentestGPTContext } from '@/context/context';
import { cn } from '@/lib/utils';
import { PluginID } from '@/types/plugins';
import {
  IconPaperclip,
  IconTerminal2,
  IconSearch,
  IconAtom,
} from '@tabler/icons-react';
import { useContext, useState } from 'react';
import { WithTooltip } from '../../ui/with-tooltip';
import { useUIContext } from '@/context/ui-context';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { PLUGINS_WITHOUT_IMAGE_SUPPORT } from '@/types/plugins';

interface ToolOptionsProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const ToolOptions = ({ fileInputRef }: ToolOptionsProps) => {
  const TOOLTIP_DELAY = 500;
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const { isPremiumSubscription, newMessageImages } =
    useContext(PentestGPTContext);

  const { selectedPlugin, setSelectedPlugin, isMobile } = useUIContext();

  const hasImageAttached = newMessageImages.length > 0;

  const handleFileClick = () => {
    // Deselect all plugins when uploading files
    if (
      selectedPlugin &&
      PLUGINS_WITHOUT_IMAGE_SUPPORT.includes(selectedPlugin)
    ) {
      setSelectedPlugin(PluginID.NONE);
    }
    fileInputRef.current?.click();
  };

  const handleTerminalToggle = () => {
    if (hasImageAttached && !isPremiumSubscription) return;

    if (!isPremiumSubscription) {
      setShowUpgradePrompt(true);
      return;
    }

    setSelectedPlugin(
      selectedPlugin === PluginID.TERMINAL ? PluginID.NONE : PluginID.TERMINAL,
    );
  };

  const handleEnhancedSearchToggle = () => {
    setSelectedPlugin(
      selectedPlugin === PluginID.ENHANCED_SEARCH
        ? PluginID.NONE
        : PluginID.ENHANCED_SEARCH,
    );
  };

  const handleReasonLLMToggle = () => {
    if (hasImageAttached) return;

    setSelectedPlugin(
      selectedPlugin === PluginID.REASONING
        ? PluginID.NONE
        : PluginID.REASONING,
    );
  };

  return (
    <div className="flex space-x-1">
      {/* File Upload Button */}
      {isPremiumSubscription && (
        <WithTooltip
          delayDuration={TOOLTIP_DELAY}
          side="top"
          display={
            <div className="flex flex-col">
              <p className="font-medium">Upload Files</p>
            </div>
          }
          trigger={
            <div
              className="flex flex-row items-center"
              onClick={handleFileClick}
            >
              <IconPaperclip
                className="cursor-pointer rounded-lg rounded-bl-xl p-1 hover:bg-black/10 focus-visible:outline-black dark:hover:bg-white/10 dark:focus-visible:outline-white"
                size={32}
              />
            </div>
          }
        />
      )}

      {/* Reason LLM Toggle */}
      <WithTooltip
        delayDuration={TOOLTIP_DELAY}
        side="top"
        display={
          selectedPlugin !== PluginID.REASONING && (
            <div className="flex flex-col">
              <p className="font-medium">Think before responding</p>
            </div>
          )
        }
        trigger={
          <div
            className={cn(
              'relative flex flex-row items-center rounded-lg transition-colors duration-300',
              selectedPlugin === PluginID.REASONING
                ? 'bg-primary/10'
                : 'hover:bg-black/10 dark:hover:bg-white/10',
              hasImageAttached && 'pointer-events-none opacity-50',
            )}
            onClick={handleReasonLLMToggle}
          >
            <IconAtom
              className={cn(
                'cursor-pointer rounded-lg rounded-bl-xl p-1 focus-visible:outline-black dark:focus-visible:outline-white',
                selectedPlugin === PluginID.REASONING
                  ? 'text-primary'
                  : 'opacity-50',
              )}
              size={32}
            />
            <div
              className={cn(
                'whitespace-nowrap text-xs font-medium',
                'transition-all duration-300',
                !isMobile && 'max-w-[100px] pr-2',
                isMobile &&
                  (selectedPlugin === PluginID.REASONING
                    ? 'max-w-[100px] pr-2 opacity-100'
                    : 'max-w-0 opacity-0'),
              )}
            >
              Reason
            </div>
          </div>
        }
      />

      {/* Enhanced Search Tool */}
      <WithTooltip
        delayDuration={TOOLTIP_DELAY}
        side="top"
        display={
          <div className="flex flex-col">
            <p className="font-medium">Search pentesting knowledge base</p>
          </div>
        }
        trigger={
          <div
            className={cn(
              'relative flex flex-row items-center rounded-lg transition-colors duration-300',
              selectedPlugin === PluginID.ENHANCED_SEARCH
                ? 'bg-primary/10'
                : 'hover:bg-black/10 dark:hover:bg-white/10',
            )}
            onClick={handleEnhancedSearchToggle}
          >
            <IconSearch
              className={cn(
                'cursor-pointer rounded-lg rounded-bl-xl p-1 focus-visible:outline-black dark:focus-visible:outline-white',
                selectedPlugin === PluginID.ENHANCED_SEARCH
                  ? 'text-primary'
                  : 'opacity-50',
              )}
              size={32}
            />
            <div
              className={cn(
                'whitespace-nowrap text-xs font-medium',
                'transition-all duration-300',
                !isMobile && 'max-w-[100px] pr-2',
                isMobile &&
                  (selectedPlugin === PluginID.ENHANCED_SEARCH
                    ? 'max-w-[100px] pr-2 opacity-100'
                    : 'max-w-0 opacity-0'),
              )}
            >
              RAG Search
            </div>
          </div>
        }
      />

      {/* Terminal Tool */}
      <WithTooltip
        delayDuration={TOOLTIP_DELAY}
        side="top"
        display={
          <div className="flex flex-col">
            {!isPremiumSubscription ? (
              <UpgradePrompt
                title="Upgrade to Pro"
                description="Get access to terminal and more features with Pro"
                buttonText="Upgrade Now"
              />
            ) : (
              <p className="font-medium">Execute terminal commands</p>
            )}
          </div>
        }
        trigger={
          <div
            className={cn(
              'relative flex flex-row items-center rounded-lg transition-colors duration-300',
              selectedPlugin === PluginID.TERMINAL
                ? 'bg-primary/10'
                : 'hover:bg-black/10 dark:hover:bg-white/10',
              hasImageAttached &&
                !isPremiumSubscription &&
                'pointer-events-none opacity-50',
              !isPremiumSubscription && 'opacity-50',
            )}
            onClick={handleTerminalToggle}
          >
            <IconTerminal2
              className={cn(
                'cursor-pointer rounded-lg rounded-bl-xl p-1 focus-visible:outline-black dark:focus-visible:outline-white',
                selectedPlugin === PluginID.TERMINAL
                  ? 'text-primary'
                  : 'opacity-50',
              )}
              size={32}
            />
            <div
              className={cn(
                'whitespace-nowrap text-xs font-medium',
                'transition-all duration-300',
                !isMobile && 'max-w-[100px] pr-2',
                isMobile &&
                  (selectedPlugin === PluginID.TERMINAL
                    ? 'max-w-[100px] pr-2 opacity-100'
                    : 'max-w-0 opacity-0'),
              )}
            >
              Terminal
            </div>
          </div>
        }
      />

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6">
            <UpgradePrompt
              title="Upgrade to Pro"
              description="Get access to terminal and more features with Pro"
              buttonText="Upgrade Now"
            />
            <button
              className="mt-4 w-full rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
              onClick={() => setShowUpgradePrompt(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

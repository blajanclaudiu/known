import type { FC } from 'react';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { ThemeSwitcher } from '../theme-switcher';
import { IconLogout } from '@tabler/icons-react';
import { Switch } from '@/components/ui/switch';
import { useUIContext } from '@/context/ui-context';
import { useAgentModePreference } from '@/components/messages/terminal-messages/use-auto-run-preference';

interface GeneralTabProps {
  handleDeleteAllChats: () => void;
  handleSignOut: () => void;
}

export const GeneralTab: FC<GeneralTabProps> = ({
  handleDeleteAllChats,
  handleSignOut,
}) => {
  const { showTerminalOutput, setShowTerminalOutput } = useUIContext();
  const { agentMode, setAgentMode } = useAgentModePreference();

  const handleToggleTerminalOutput = (checked: boolean) => {
    setShowTerminalOutput(checked);
  };

  const handleToggleAutoRun = (checked: boolean) => {
    setAgentMode(checked ? 'auto-run' : 'ask-every-time');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Theme</Label>
        <ThemeSwitcher />
      </div>

      <div className="flex items-center justify-between">
        <Label className="max-w-[80%] shrink leading-normal">
          Always show terminal output when using plugins
        </Label>
        <div className="flex grow justify-end">
          <Switch
            id="show-terminal-output"
            checked={showTerminalOutput}
            onCheckedChange={handleToggleTerminalOutput}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label className="max-w-[80%] shrink leading-normal">
          Allow to run terminal without asking for confirmation
        </Label>
        <div className="flex grow justify-end">
          <Switch
            id="auto-run-terminal"
            checked={agentMode === 'auto-run'}
            onCheckedChange={handleToggleAutoRun}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label>Delete all chats</Label>
        <Button variant="destructive" onClick={handleDeleteAllChats}>
          Delete all
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <Label>Log out</Label>
        <Button
          variant="secondary"
          onClick={handleSignOut}
          className="flex items-center"
        >
          <IconLogout className="mr-2" size={18} />
          Log out
        </Button>
      </div>
    </div>
  );
};

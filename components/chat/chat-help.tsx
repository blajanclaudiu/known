import {
  IconBrandGithub,
  IconBrandX,
  IconKeyboard,
  IconQuestionMark,
  IconCopy,
  IconExternalLink,
} from '@tabler/icons-react';
import Link from 'next/link';
import { type FC, useState, useContext } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { PentestGPTContext } from '@/context/context';
import dynamic from 'next/dynamic';

const DynamicKeyboardShortcutsPopup = dynamic(
  () => import('./keyboard-shortcuts-popup'),
  { ssr: false },
);

export const ChatHelp: FC = () => {
  const { userEmail } = useContext(PentestGPTContext);

  const [isOpen, setIsOpen] = useState(false);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const { copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const socialLinks = [
    { id: 'x', icon: IconBrandX, href: 'https://x.com/PentestGPT' },
    {
      id: 'github',
      icon: IconBrandGithub,
      href: 'https://github.com/hackerai-tech/PentestGPT',
    },
  ];

  const truncateEmail = (email: string, maxLength = 25) => {
    if (email.length <= maxLength) return email;
    const [username, domain] = email.split('@');
    if (!domain) return `${email.slice(0, maxLength)}...`;
    const truncatedUsername = `${username.slice(0, maxLength - domain.length - 3)}...`;
    return `${truncatedUsername}@${domain}`;
  };

  const handleCopyEmail = () => {
    copyToClipboard(userEmail);
    toast.success('Email copied to clipboard', {
      duration: 3000,
    });
  };

  const menuItems = [
    {
      id: 'copy-email',
      icon: IconCopy,
      text: truncateEmail(userEmail),
      onClick: handleCopyEmail,
    },
    {
      id: 'help-faq',
      icon: IconExternalLink,
      text: 'Help & FAQ',
      href: 'https://help.hackerai.co/en/collections/10615918-pentestgpt',
    },
    {
      id: 'keyboard-shortcuts',
      icon: IconKeyboard,
      text: 'Keyboard shortcuts',
      onClick: () => setIsKeyboardShortcutsOpen(true),
    },
  ];

  return (
    <div
      className={`absolute bottom-2 end-2 z-20 hidden sm:block lg:bottom-3 lg:end-3`}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <IconQuestionMark className="bg-primary text-secondary size-[20px] cursor-pointer rounded-full p-0.5 opacity-60 hover:opacity-50" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="min-w-[280px] max-w-xs overflow-hidden rounded-2xl p-4 py-2"
        >
          <DropdownMenuLabel className="mb-2 flex items-center justify-between">
            <div className="flex space-x-4">
              {socialLinks.map(({ id, icon: Icon, href }) => (
                <Link
                  key={id}
                  className="cursor-pointer hover:opacity-50"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon size={24} />
                </Link>
              ))}
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-2" />

          {menuItems.map(({ id, icon: Icon, text, onClick, href }) => (
            <DropdownMenuItem key={id} className="cursor-pointer py-1">
              {href ? (
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex w-full items-center justify-start space-x-2 p-0 hover:bg-transparent"
                  >
                    <Icon className="mr-2 size-5" />
                    <span className="text-sm">{text}</span>
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex w-full items-center justify-start space-x-2 p-0 hover:bg-transparent"
                  onClick={onClick}
                >
                  <Icon className="mr-2 size-5" />
                  <span className="text-sm">{text}</span>
                </Button>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {isKeyboardShortcutsOpen && (
        <DynamicKeyboardShortcutsPopup
          isOpen={isKeyboardShortcutsOpen}
          onClose={() => setIsKeyboardShortcutsOpen(false)}
        />
      )}
    </div>
  );
};

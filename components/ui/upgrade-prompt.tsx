import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface UpgradePromptProps {
  title?: string;
  description?: string;
  buttonText?: string;
}

export const UpgradePrompt = ({
  title = 'Upgrade to Pro',
  description = 'Get access to web search and more features with Pro',
  buttonText = 'Upgrade Now',
}: UpgradePromptProps) => {
  const router = useRouter();

  return (
    <div className="w-[280px] p-1 bg-background rounded-lg space-y-3">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button
        variant="default"
        className="w-full"
        onClick={() => router.push('/upgrade')}
      >
        {buttonText}
      </Button>
    </div>
  );
};

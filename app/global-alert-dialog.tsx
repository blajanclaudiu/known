'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAlertContext } from '@/context/alert-context';
import { IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

export const GlobalAlertDialog = () => {
  const { state, dispatch } = useAlertContext();

  const handleOpenChange = () => {
    dispatch({ type: 'HIDE' });
  };

  return (
    <Dialog open={!!state.message} onOpenChange={handleOpenChange}>
      <DialogContent
        className="xl:max-w-xl"
        aria-describedby="alert-description"
      >
        <DialogHeader>
          <div className="flex justify-between">
            <DialogTitle>{state.title || 'Alert'}</DialogTitle>
            <IconX
              className="cursor-pointer text-gray-500 hover:opacity-50"
              size={24}
              onClick={() => handleOpenChange()}
            />
          </div>
        </DialogHeader>

        <div className="mt-4">
          <p id="alert-description" className="whitespace-pre-wrap">
            {state.message}
          </p>

          {state.action && (
            <div className="mt-6 flex justify-center">
              <Button onClick={state.action.onClick}>
                {state.action.label}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

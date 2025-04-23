'use client';

import { ChangePassword } from '@/components/utility/change-password';
import { PentestGPTContext } from '@/context/context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useContext, useEffect } from 'react';

export default function ChangePasswordPage() {
  const { user } = useContext(PentestGPTContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      // Check for error parameters in URL
      const error = searchParams.get('error');

      if (error) {
        router.push('/login?message=code_expired');
        return;
      }

      if (!user) {
        router.push('/login');
      }
    })();
  }, [user, searchParams]);

  return <ChangePassword />;
}

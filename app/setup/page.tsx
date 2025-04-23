'use client';

import { PentestGPTContext } from '@/context/context';
import { getProfileByUserId } from '@/db/profile';
// import { TablesUpdate } from "@/supabase/types"
// import { updateProfile } from "@/db/profile"
import { useRouter } from 'next/navigation';
import { useContext, useEffect } from 'react';

export default function SetupPage() {
  const { setProfile, fetchStartingData, user } = useContext(PentestGPTContext);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      const profile = await getProfileByUserId(user.id);
      setProfile(profile);

      if (!profile) {
        throw new Error('Profile not found');
      }

      // if (!profile.has_onboarded) {
      //   const updateProfilePayload: TablesUpdate<"profiles"> = {
      //     ...profile,
      //     has_onboarded: true
      //   }
      //   await updateProfile(profile.id, updateProfilePayload)
      // }

      await fetchStartingData();

      router.push(`/c`);
    })();
  }, []);

  return null;
}

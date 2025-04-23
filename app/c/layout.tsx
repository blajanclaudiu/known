'use client';

import { Dashboard } from '@/components/ui/dashboard';
import { PentestGPTContext } from '@/context/context';
import { useUIContext } from '@/context/ui-context';
import { getChatsByUserId } from '@/db/chats';
import { localDB } from '@/db/local/db';
import { getSubscriptionByUserId } from '@/db/subscriptions';
import { LargeModel, SmallModel } from '@/lib/models/hackerai-llm-list';
import { useRouter } from 'next/navigation';
import { type ReactNode, useContext, useEffect, useState } from 'react';
import Loading from '../loading';
import { supabase } from '@/lib/supabase/browser-client';
import { refreshLocalData } from '@/db/refresh-local-data';

interface WorkspaceLayoutProps {
  children: ReactNode;
}

const fetchWorkspaceData = async (
  userId: string,
  setChats: (chats: any[]) => void,
) => {
  try {
    const chats = await getChatsByUserId(userId, false);
    await refreshLocalData(chats);

    setChats(chats);
    return true;
  } catch (error) {
    console.error('Error fetching workspace data:', error);
    return false;
  }
};

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Destructure all context values in a single statement
  const {
    setChatSettings,
    setChats,
    setSelectedChat,
    setChatMessages,
    setUserInput,
    setChatFiles,
    setChatImages,
    setNewMessageFiles,
    setNewMessageImages,
    user,
  } = useContext(PentestGPTContext);

  const { setIsGenerating, setFirstTokenReceived } = useUIContext();

  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        if (!user) {
          router.push('/login');
          return;
        }

        // Get subscription and set model
        const subscription = await getSubscriptionByUserId(user.id);
        const modelId =
          subscription?.status === 'active'
            ? LargeModel.modelId
            : SmallModel.modelId;

        setChatSettings({
          model: modelId,
        });

        // Reset all chat-specific states
        setSelectedChat(null);
        setChatMessages([]);
        setUserInput('');
        setChatFiles([]);
        setChatImages([]);
        setNewMessageFiles([]);
        setNewMessageImages([]);
        setIsGenerating(false);
        setFirstTokenReceived(false);

        // Fetch workspace data
        const success = await fetchWorkspaceData(user.id, setChats);
        if (!success) {
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Workspace initialization error:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    initializeWorkspace();
  }, [router]);

  // Check authentication status and refresh token if needed
  async function checkAuthStatus() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      await localDB.storage.clearAll();
      router.push('/login');
    }
    return !!user;
  }

  useEffect(() => {
    // Set up periodic checks
    function setupPeriodicChecks(intervalMinutes: number) {
      const intervalId = setInterval(
        async () => {
          await checkAuthStatus();
        },
        intervalMinutes * 60 * 1000,
      );

      // Clean up interval on component unmount
      return () => clearInterval(intervalId);
    }

    return setupPeriodicChecks(15); // Check every 15 minutes
  }, [router]);

  if (loading) {
    return <Loading />;
  }

  return <Dashboard>{children}</Dashboard>;
}

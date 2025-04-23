import { useState, useEffect } from 'react';
import type { AgentMode } from '@/types/llms';

const agentModeKey = 'agentMode';

export const useAgentModePreference = () => {
  const [agentMode, setAgentMode] = useState<AgentMode>('ask-every-time');

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem(agentModeKey) as AgentMode;
      if (savedPreference) {
        setAgentMode(savedPreference);
      }
    }
  }, []);

  const updateAgentMode = (value: AgentMode) => {
    setAgentMode(value);
    localStorage.setItem(agentModeKey, value);
  };

  return {
    agentMode,
    setAgentMode: updateAgentMode,
  };
};

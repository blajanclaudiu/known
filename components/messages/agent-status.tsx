/**
 * Represents the different states an agent can be in during execution
 */
export enum AgentStatusState {
  THINKING = 'message_notify_user',
  TERMINAL = 'terminal',
  FILE_WRITE = 'file_write',
  FILE_READ = 'file_read',
  WEB_SEARCH = 'websearch',
  BROWSER = 'browser',
  SHELL_WAIT = 'shell_wait',
  SHELL_KILL_PROCESS = 'shell_kill_process',
}

/**
 * Human-readable descriptions for each agent state
 */
export const AgentStatusLabels: Record<AgentStatusState, string> = {
  [AgentStatusState.THINKING]: 'Thinking',
  [AgentStatusState.TERMINAL]: 'Using terminal',
  [AgentStatusState.FILE_WRITE]: 'Writing to file',
  [AgentStatusState.FILE_READ]: 'Reading file',
  [AgentStatusState.WEB_SEARCH]: 'Searching the web',
  [AgentStatusState.BROWSER]: 'Browsing the web',
  [AgentStatusState.SHELL_WAIT]: 'Waiting for terminal',
  [AgentStatusState.SHELL_KILL_PROCESS]: 'Terminating process',
};

/**
 * Color configurations for different agent states
 */
const AgentStatusColors: Record<
  AgentStatusState,
  { ping: string; base: string }
> = {
  [AgentStatusState.THINKING]: {
    ping: 'bg-blue-400',
    base: 'bg-blue-500',
  },
  [AgentStatusState.TERMINAL]: {
    ping: 'bg-amber-400',
    base: 'bg-amber-500',
  },
  [AgentStatusState.FILE_WRITE]: {
    ping: 'bg-green-400',
    base: 'bg-green-500',
  },
  [AgentStatusState.FILE_READ]: {
    ping: 'bg-purple-400',
    base: 'bg-purple-500',
  },
  [AgentStatusState.WEB_SEARCH]: {
    ping: 'bg-red-400',
    base: 'bg-red-500',
  },
  [AgentStatusState.BROWSER]: {
    ping: 'bg-orange-400',
    base: 'bg-orange-500',
  },
  [AgentStatusState.SHELL_WAIT]: {
    ping: 'bg-yellow-400',
    base: 'bg-yellow-500',
  },
  [AgentStatusState.SHELL_KILL_PROCESS]: {
    ping: 'bg-red-400',
    base: 'bg-red-500',
  },
};

/**
 * Helper function to check if a value is a valid AgentStatusState
 */
export const isValidAgentStatus = (
  state: string | null,
): state is AgentStatusState => {
  if (!state) return false;
  return Object.values(AgentStatusState).includes(state as AgentStatusState);
};

export const AgentStatus = ({ state }: { state: AgentStatusState | null }) => {
  // If state is null or invalid, don't render anything
  if (!isValidAgentStatus(state)) {
    return null;
  }

  const text = AgentStatusLabels[state];
  const colors = AgentStatusColors[state];

  return (
    <div className="mt-2 flex items-center space-x-3 text-sm">
      <div className="relative flex size-3">
        <span
          className={`absolute inline-flex size-full animate-ping rounded-full ${colors.ping} opacity-75`}
        />
        <span
          className={`relative inline-flex size-3 rounded-full ${colors.base}`}
        />
      </div>
      <div>{text}</div>
    </div>
  );
};

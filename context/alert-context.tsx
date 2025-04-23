'use client';

import { createContext, useContext, useReducer } from 'react';

interface AlertState {
  message: string;
  title?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type AlertAction =
  | {
      type: 'SHOW';
      payload: {
        message: string;
        title?: string;
        action?: { label: string; onClick: () => void };
      };
    }
  | { type: 'HIDE' };

const initialState: AlertState = {
  message: '',
};

const AlertContext = createContext<{
  state: AlertState;
  dispatch: React.Dispatch<AlertAction>;
}>({
  state: initialState,
  dispatch: () => undefined,
});

const alertReducer = (state: AlertState, action: AlertAction): AlertState => {
  switch (action.type) {
    case 'SHOW':
      return {
        ...state,
        message: action.payload.message,
        title: action.payload.title,
        action: action.payload.action,
      };
    case 'HIDE':
      return { ...state, message: '', title: undefined, action: undefined };
    default:
      return state;
  }
};

const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(alertReducer, initialState);

  return (
    <AlertContext.Provider value={{ state, dispatch }}>
      {children}
    </AlertContext.Provider>
  );
};

const useAlertContext = () => {
  const { state, dispatch } = useContext(AlertContext);
  dispatch;

  return { state, dispatch };
};

export { AlertProvider, useAlertContext };

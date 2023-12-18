import React from 'react';
import {Session} from '../../../../share';

interface ContextProps {
  session: Session;
  reactAppId: string;
  isMarkdownView: boolean;
}

const MountContext = React.createContext<ContextProps | null>(null);

export const useAppMount = () => {
  const value = React.useContext(MountContext);
  if (value === null) {
    throw new Error(
      'useAppMount() called without a <AppMountProvider /> in the tree.'
    );
  }

  return value;
};

interface Props extends ContextProps {
  children: React.ReactNode;
}

export default function AppMountProvider({
  session,
  reactAppId,
  isMarkdownView,
  children,
}: Props) {
  return (
    <MountContext.Provider
      value={{session, reactAppId, isMarkdownView }}
    >
      {children}
    </MountContext.Provider>
  );
}

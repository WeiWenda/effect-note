import React from 'react';
import {Path, Session} from '../../../../share';

interface ContextProps {
  session: Session;
  title: string;
  path: Path;
  collapse: boolean;
  reactAppId: string;
  isMarkdownView: boolean;
  forSetting: boolean;
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
  title,
  collapse,
  path,
  session,
  reactAppId,
  isMarkdownView,
  forSetting,
  children,
}: Props) {
  return (
    <MountContext.Provider
      value={{title, collapse, path, session, reactAppId, isMarkdownView, forSetting }}
    >
      {children}
    </MountContext.Provider>
  );
}

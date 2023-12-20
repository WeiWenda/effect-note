import React from 'react';

interface ContextProps {
  modalEl: HTMLElement;
}

const MountContext = React.createContext<ContextProps | null>(null);

export const useModalMount = () => {
  const value = React.useContext(MountContext);
  if (value === null) {
    throw new Error(
      'useModalMount() called without a <ModalMountProvider /> in the tree.'
    );
  }

  return value;
};

interface Props extends ContextProps {
  children: React.ReactNode;
}

export default function ModalMountProvider({
  modalEl,
  children,
}: Props) {
  return (
    <MountContext.Provider value={{modalEl }}>
      {children}
    </MountContext.Provider>
  );
}

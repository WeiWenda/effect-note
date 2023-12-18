import React from 'react';

import BaseMenu from '../base-menu';

import { LoomMenuOpenDirection, LoomMenuPosition } from './types';

interface Props {
  id: string;
  isOpen: boolean;
  position: LoomMenuPosition;
  hideBorder?: boolean;
  openDirection?: LoomMenuOpenDirection;
  topOffset?: number;
  leftOffset?: number;
  minWidth?: number;
  width?: number;
  height?: number;
  maxWidth?: number;
  maxHeight?: number;
  children: React.ReactNode;
}

export default function Menu({
  id,
  isOpen,
  hideBorder = false,
  position,
  minWidth = 0,
  width = 0,
  height = 0,
  maxHeight = 0,
  maxWidth = 0,
  children,
}: Props) {
  const ref = React.useRef<HTMLDivElement>(null);

  return (
    <BaseMenu
      ref={ref}
      id={id}
      isOpen={isOpen}
      hideBorder={hideBorder}
      position={position}
      width={width}
      height={height}
      minWidth={minWidth}
      maxHeight={maxHeight}
      maxWidth={maxWidth}
    >
      {children}
    </BaseMenu>
  );
}

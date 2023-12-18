import { AlignItems, JustifyContent } from '../render/types';
import { getDynamicSize } from '../render/utils';
import { getSpacing } from '../spacing';
import { DynamicSize, SpacingSize } from '../spacing/types';

import './styles.css';

interface Props {
  justify?: DynamicSize<JustifyContent> | JustifyContent;
  align?: AlignItems;
  width?: DynamicSize<string> | string;
  spacingX?: SpacingSize;
  spacingY?: SpacingSize;
  children: React.ReactNode;
}

export default function Wrap({
  justify,
  align = 'center',
  spacingX = 'md',
  spacingY = 'md',
  width,
  children,
}: Props) {
  const justifyContent = getDynamicSize('flex-start', justify);
  const renderWidth = getDynamicSize('100%', width);

  return (
    <div
      className='dataloom-wrap'
      style={{
        width: renderWidth,
        rowGap: getSpacing(spacingX),
        columnGap: getSpacing(spacingY),
        justifyContent,
        alignItems: align,
      }}
    >
      {children}
    </div>
  );
}

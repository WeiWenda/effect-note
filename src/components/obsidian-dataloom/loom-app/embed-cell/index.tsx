import { getEmbedCellContent } from 'src/components/obsidian-dataloom/shared/cell-content/embed-cell-content';
import {
  AspectRatio,
  PaddingSize,
} from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';

import Embed from './embed';
import { useAppMount } from '../app-mount-provider';

import './styles.css';

interface Props {
  isExternal: boolean;
  pathOrUrl: string;
  aspectRatio: AspectRatio;
  horizontalPadding: PaddingSize;
  verticalPadding: PaddingSize;
}

export default function EmbedCell({
  isExternal,
  pathOrUrl,
  aspectRatio,
  horizontalPadding,
  verticalPadding,
}: Props) {
  const content = getEmbedCellContent(pathOrUrl, {
    isExternal,
  });
  return (
    <div className='dataloom-embed-cell'>
      <Embed
        isExternalLink={isExternal}
        content={content}
        aspectRatio={aspectRatio}
        horizontalPadding={horizontalPadding}
        verticalPadding={verticalPadding}
      />
    </div>
  );
}

import { getSpacing } from 'src/components/obsidian-dataloom/shared/spacing';
import {
  AspectRatio,
  PaddingSize,
} from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';
import { appendOrReplaceFirstChild } from 'src/components/obsidian-dataloom/shared/render/utils';

interface Props {
  isExternalLink: boolean;
  content: string;
  aspectRatio: AspectRatio;
  horizontalPadding: PaddingSize;
  verticalPadding: PaddingSize;
}

// TODO move out of separate file?
export default function Embed({
  isExternalLink,
  content,
  aspectRatio,
  horizontalPadding,
  verticalPadding,
}: Props) {
  const paddingX = getSpacing(horizontalPadding);
  const paddingY = getSpacing(verticalPadding);

  return (
    <div
      style={{
        aspectRatio,
        paddingLeft: paddingX,
        paddingRight: paddingX,
        paddingTop: paddingY,
        paddingBottom: paddingY,
      }}
    >
      {content}
    </div>
  );
}

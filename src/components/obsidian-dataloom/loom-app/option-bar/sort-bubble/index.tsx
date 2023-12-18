import Icon from 'src/components/obsidian-dataloom/shared/icon';
import Bubble from 'src/components/obsidian-dataloom/shared/bubble';

import { SortDir } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';

interface SortBubbleProps {
  sortDir: SortDir;
  content: string;
  onRemoveClick: () => void;
}

export default function SortBubble({
  sortDir,
  content,
  onRemoveClick,
}: SortBubbleProps) {
  return (
    <div className='dataloom-sort-bubble'>
      <Bubble
        canRemove
        value={content}
        icon={
          sortDir === SortDir.ASC ? (
            <Icon lucideId='ArrowUp' />
          ) : (
            <Icon lucideId='ArrowDown' />
          )
        }
        onRemoveClick={onRemoveClick}
      />
    </div>
  );
}

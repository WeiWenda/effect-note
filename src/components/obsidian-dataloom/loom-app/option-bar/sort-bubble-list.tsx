import SortBubble from './sort-bubble';
import Stack from 'src/components/obsidian-dataloom/shared/stack';

import { Column } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';

interface Props {
  sortedColumns: Column[];
  onRemoveClick: (columnId: string) => void;
}

export default function SortBubbleList({
  sortedColumns,
  onRemoveClick,
}: Props) {
  return (
    <Stack spacing='sm' isHorizontal>
      {sortedColumns.map((column, i) => {
        const { id, sortDir, content } = column;
        return (
          <SortBubble
            key={i}
            sortDir={sortDir}
            content={content}
            onRemoveClick={() => onRemoveClick(id)}
          />
        );
      })}
    </Stack>
  );
}

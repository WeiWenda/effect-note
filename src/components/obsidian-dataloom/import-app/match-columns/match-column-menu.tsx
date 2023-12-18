import MenuItem from 'src/components/obsidian-dataloom/shared/menu-item';
import ModalMenu from 'src/components/obsidian-dataloom/shared/model-menu';
import { LoomMenuPosition } from 'src/components/obsidian-dataloom/shared/menu/types';
import { ColumnMatch } from '../types';
import { getIconIdForCellType } from 'src/components/obsidian-dataloom/shared/icon/utils';
import Divider from 'src/components/obsidian-dataloom/shared/divider';
import { NEW_COLUMN_ID } from '../constants';
import { CellType, Column } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';

interface Props {
  id: string;
  isOpen: boolean;
  position: LoomMenuPosition;
  columns: Column[];
  columnMatches: ColumnMatch[];
  selectedColumnId: string | null;
  onColumnClick: (columnId: string | null) => void;
}

export default function MatchColumnMenu({
  id,
  position,
  isOpen,
  columns,
  columnMatches,
  selectedColumnId,
  onColumnClick,
}: Props) {
  return (
    <ModalMenu
      id={id}
      isOpen={isOpen}
      position={position}
      openDirection='bottom-left'
    >
      {columns
        .filter(
          (column) =>
            column.type !== CellType.SOURCE &&
            column.type !== CellType.SOURCE_FILE &&
            column.type !== CellType.LAST_EDITED_TIME &&
            column.type !== CellType.CREATION_TIME
        )
        .map((column) => {
          const { id, content, type } = column;
          const isDisabled = columnMatches.some(
            (match) => match.columnId === id
          );

          return (
            <MenuItem
              key={id}
              name={content}
              isDisabled={isDisabled}
              lucideId={getIconIdForCellType(type)}
              onClick={() => onColumnClick(id)}
              isSelected={id === selectedColumnId}
            />
          );
        })}
      <Divider />
      <MenuItem
        name='Match as new'
        onClick={() => onColumnClick(NEW_COLUMN_ID)}
        isSelected={selectedColumnId === NEW_COLUMN_ID}
      />
      {selectedColumnId !== null && (
        <>
          <Divider />
          <MenuItem
            name='Unmatch'
            onClick={() => onColumnClick(null)}
          />
        </>
      )}
    </ModalMenu>
  );
}

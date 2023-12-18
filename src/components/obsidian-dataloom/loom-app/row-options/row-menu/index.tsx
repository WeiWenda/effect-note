import Menu from '../../../shared/menu';
import MenuItem from '../../../shared/menu-item';
import { LoomMenuPosition } from '../../../shared/menu/types';

interface Props {
  id: string;
  isOpen: boolean;
  position: LoomMenuPosition;
  canDeleteRow: boolean;
  onDeleteClick: () => void;
  onInsertAboveClick: () => void;
  onInsertBelowClick: () => void;
}
export default function RowOptions({
  id,
  isOpen,
  position,
  canDeleteRow,
  onDeleteClick,
  onInsertAboveClick,
  onInsertBelowClick,
}: Props) {
  return (
    <Menu
      id={id}
      isOpen={isOpen}
      openDirection='bottom-right'
      position={position}
    >
      <div className='dataloom-row-menu'>
        {canDeleteRow && (
          <MenuItem
            lucideId='Trash2'
            name='Delete'
            onClick={() => onDeleteClick()}
          />
        )}
        <MenuItem
          lucideId='ChevronsUp'
          name='Insert above'
          onClick={() => onInsertAboveClick()}
        />
        <MenuItem
          lucideId='ChevronsDown'
          name='Insert below'
          onClick={() => onInsertBelowClick()}
        />
      </div>
    </Menu>
  );
}

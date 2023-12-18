import ModalMenu from 'src/components/obsidian-dataloom/shared/model-menu';
import { LoomMenuPosition } from 'src/components/obsidian-dataloom/shared/menu/types';

import MenuItem from 'src/components/obsidian-dataloom/shared/menu-item';
import { NEW_COLUMN_ID } from '../constants';

interface Props {
  id: string;
  isOpen: boolean;
  position: LoomMenuPosition;
  onAllColumnsEnabledToggle: (isEnabled: boolean) => void;
  onAllColumnsMatch: (columnId: string | null) => void;
}

export default function BulkOptionsMenu({
  id,
  position,
  isOpen,
  onAllColumnsEnabledToggle,
  onAllColumnsMatch,
}: Props) {
  return (
    <ModalMenu
      id={id}
      isOpen={isOpen}
      position={position}
      openDirection='bottom'
    >
      <MenuItem
        name='Match all as new'
        onClick={() => onAllColumnsMatch(NEW_COLUMN_ID)}
      />
      <MenuItem
        name='Disable all'
        onClick={() => onAllColumnsEnabledToggle(false)}
      />
      <MenuItem
        name='Enable all'
        onClick={() => onAllColumnsEnabledToggle(true)}
      />
      <MenuItem
        name='Unmatch all'
        onClick={() => onAllColumnsMatch(null)}
      />
    </ModalMenu>
  );
}

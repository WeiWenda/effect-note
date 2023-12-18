import MenuItem from 'src/components/obsidian-dataloom/shared/menu-item';
import Submenu from '../../shared/submenu';
import { CellType } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';
import { getDisplayNameForCellType } from 'src/components/obsidian-dataloom/shared/loom-state/type-display-names';
import { getIconIdForCellType } from 'src/components/obsidian-dataloom/shared/icon/utils';
interface Props {
  title: string;
  value: CellType;
  onValueClick: (value: CellType) => void;
  onBackClick: () => void;
}

export default function TypeSubmenu({
  title,
  value,
  onValueClick,
  onBackClick,
}: Props) {
  return (
    <Submenu title={title} onBackClick={onBackClick}>
      {Object.values(CellType)
        .filter(
          (type) =>
            type !== CellType.SOURCE &&
            type !== CellType.SOURCE_FILE
        )
        .map((type: CellType) => (
          <MenuItem
            key={type}
            name={getDisplayNameForCellType(type)}
            lucideId={getIconIdForCellType(type)}
            onClick={() => onValueClick(type)}
            isSelected={type === value}
          />
        ))}
    </Submenu>
  );
}

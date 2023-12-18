import Menu from 'src/components/obsidian-dataloom/shared/menu';
import MenuItem from 'src/components/obsidian-dataloom/shared/menu-item';
import { LoomMenuPosition } from 'src/components/obsidian-dataloom/shared/menu/types';

import { getDisplayNameForDateFormat } from 'src/components/obsidian-dataloom/shared/loom-state/type-display-names';
import { DateFormat } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';

interface Props {
  id: string;
  isOpen: boolean;
  position: LoomMenuPosition;
  value: DateFormat;
  onChange: (value: DateFormat) => void;
}

export default function DateFormatMenu({
  id,
  position,
  isOpen,
  value,
  onChange,
}: Props) {
  return (
    <Menu
      isOpen={isOpen}
      id={id}
      position={position}
      width={175}
      topOffset={10}
      leftOffset={75}
    >
      <div className='dataloom-date-format-menu'>
        {Object.values(DateFormat).map((format) => (
          <MenuItem
            key={format}
            name={getDisplayNameForDateFormat(format)}
            isSelected={value === format}
            onClick={() => {
              onChange(format);
            }}
          />
        ))}
      </div>
    </Menu>
  );
}

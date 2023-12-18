import Menu from 'src/components/obsidian-dataloom/shared/menu';
import MenuItem from 'src/components/obsidian-dataloom/shared/menu-item';
import { LoomMenuPosition } from 'src/components/obsidian-dataloom/shared/menu/types';

import { getDisplayNameForDateFormatSeparator } from 'src/components/obsidian-dataloom/shared/loom-state/type-display-names';
import { DateFormatSeparator } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';

interface Props {
  id: string;
  isOpen: boolean;
  position: LoomMenuPosition;
  value: DateFormatSeparator;
  onChange: (value: DateFormatSeparator) => void;
}

export default function DateFormatSeparatorMenu({
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
      <div className='dataloom-date-format-separator-menu'>
        {Object.values(DateFormatSeparator).map((format) => (
          <MenuItem
            key={format}
            name={getDisplayNameForDateFormatSeparator(format)}
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

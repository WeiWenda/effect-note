import React from 'react';

import { useAppSelector } from '../../redux/hooks';

import Menu from '../../shared/menu';
import ColorItem from './components/color-item';
import Text from '../../shared/text';
import Divider from '../../shared/divider';
import Stack from '../../shared/stack';
import MenuItem from '../../shared/menu-item';
import Padding from '../../shared/padding';
import Input from '../../shared/input';

import { Color } from '../../shared/loom-state/types/loom-state';
import { LoomMenuCloseRequest } from '../../shared/menu-provider/types';
import { LoomMenuPosition } from '../../shared/menu/types';

import './styles.css';

interface Props {
  id: string;
  isOpen: boolean;
  content: string;
  position: LoomMenuPosition;
  selectedColor: string;
  closeRequest: LoomMenuCloseRequest | null;
  onColorClick: (color: Color) => void;
  onDeleteClick: () => void;
  onTagContentChange: (value: string) => void;
  onClose: () => void;
}

export default function TagColorMenu({
  id,
  isOpen,
  position,
  selectedColor,
  content,
  closeRequest,
  onColorClick,
  onDeleteClick,
  onTagContentChange,
  onClose,
}: Props) {
  const { isDarkMode } = useAppSelector((state) => state.global);
  const [localValue, setLocalValue] = React.useState(content);

  React.useEffect(
    function saveOnCloseRequest() {
      if (closeRequest === null) return;
      if (content !== localValue) onTagContentChange(localValue);
      onClose();
    },
    [closeRequest, content, localValue, onTagContentChange, onClose]
  );

  return (
    <Menu
      id={id}
      isOpen={isOpen}
      position={position}
      topOffset={-75}
      leftOffset={-50}
    >
      <div className='dataloom-tag-color-menu'>
        <Stack spacing='sm'>
          <Padding px='md' py='sm'>
            <Input value={localValue} onChange={setLocalValue} />
          </Padding>
          <MenuItem
            lucideId='Trash2'
            name='Delete'
            onClick={onDeleteClick}
          />
          <Divider />
          <Padding px='lg' py='sm'>
            <Text value='Colors' />
          </Padding>
          <div className='dataloom-tag-color-menu__color-container'>
            {Object.values(Color).map((color) => (
              <ColorItem
                isDarkMode={isDarkMode}
                key={color}
                color={color}
                onColorClick={onColorClick}
                isSelected={selectedColor === color}
              />
            ))}
          </div>
        </Stack>
      </div>
    </Menu>
  );
}

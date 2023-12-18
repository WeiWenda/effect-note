import React from 'react';

import Divider from 'src/components/obsidian-dataloom/shared/divider';
import MenuItem from 'src/components/obsidian-dataloom/shared/menu-item';
import Padding from 'src/components/obsidian-dataloom/shared/padding';
import Stack from 'src/components/obsidian-dataloom/shared/stack';
import Switch from 'src/components/obsidian-dataloom/shared/switch';
import Flex from 'src/components/obsidian-dataloom/shared/flex';
import Text from 'src/components/obsidian-dataloom/shared/text';
import Input from 'src/components/obsidian-dataloom/shared/input';

import { CellType, SortDir } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';
import { SubmenuType } from './types';
import { usePlaceCursorAtEnd } from 'src/components/obsidian-dataloom/shared/hooks';
import { getDisplayNameForCellType } from 'src/components/obsidian-dataloom/shared/loom-state/type-display-names';

interface Props {
  index: number;
  canDeleteColumn: boolean;
  numSources: number;
  columnId: string;
  shouldWrapOverflow: boolean;
  frontmatterKey: string | null;
  columnName: string;
  numFrozenColumns: number;
  columnType: CellType;
  columnSortDir: SortDir;
  onColumnNameChange: (value: string) => void;
  onSortClick: (value: SortDir) => void;
  onSubmenuChange: (value: SubmenuType) => void;
  onWrapOverflowToggle: (columnId: string, value: boolean) => void;
  onDeleteClick: () => void;
  onHideClick: () => void;
  onFrozenColumnsChange: (value: number) => void;
}

export default function BaseSubmenu({
  index,
  shouldWrapOverflow,
  numFrozenColumns,
  numSources,
  frontmatterKey,
  columnName,
  columnId,
  columnType,
  columnSortDir,
  canDeleteColumn,
  onSortClick,
  onSubmenuChange,
  onWrapOverflowToggle,
  onDeleteClick,
  onColumnNameChange,
  onHideClick,
  onFrozenColumnsChange,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  usePlaceCursorAtEnd(inputRef, columnName);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  function handleInputChange(inputValue: string) {
    onColumnNameChange(inputValue);
  }

  const hasOptions =
    columnType === CellType.EMBED ||
    columnType === CellType.NUMBER ||
    columnType === CellType.LAST_EDITED_TIME ||
    columnType === CellType.CREATION_TIME;

  return (
    <Stack spacing='sm'>
      <Stack spacing='sm' width='100%'>
        <Padding px='md' py='sm' width='100%'>
          <Input
            ref={inputRef}
            isDisabled={
              columnType === CellType.SOURCE ||
              columnType === CellType.SOURCE_FILE
            }
            showBorder
            value={columnName}
            onChange={handleInputChange}
          />
        </Padding>
        {columnType !== CellType.SOURCE &&
          columnType !== CellType.SOURCE_FILE && (
            <MenuItem
              lucideId='List'
              name='Type'
              value={getDisplayNameForCellType(columnType)}
              onClick={() => {
                onSubmenuChange(SubmenuType.TYPE);
              }}
            />
          )}
        {numSources > 0 &&
          columnType !== CellType.SOURCE &&
          columnType !== CellType.SOURCE_FILE && (
            <MenuItem
              lucideId='FileKey2'
              name='Frontmatter key'
              value={frontmatterKey || 'No key set'}
              onClick={() => {
                onSubmenuChange(SubmenuType.FRONTMATTER_KEY);
              }}
            />
          )}
        {hasOptions && (
          <MenuItem
            lucideId='Settings'
            name='Options'
            onClick={() => {
              onSubmenuChange(SubmenuType.OPTIONS);
            }}
          />
        )}
      </Stack>
      <Divider />
      <MenuItem
        lucideId='ArrowUp'
        name='Ascending'
        onClick={() => onSortClick(SortDir.ASC)}
        isSelected={columnSortDir === SortDir.ASC}
      />
      <MenuItem
        lucideId='ArrowDown'
        name='Descending'
        onClick={() => onSortClick(SortDir.DESC)}
        isSelected={columnSortDir === SortDir.DESC}
      />
      <Divider />
      <MenuItem
        lucideId='EyeOff'
        name='Hide'
        onClick={() => onHideClick()}
      />
      {index < 4 && numFrozenColumns !== index + 1 && (
        <MenuItem
          lucideId='Pin'
          name='Freeze up to column'
          onClick={() => onFrozenColumnsChange(index + 1)}
        />
      )}
      {numFrozenColumns === index + 1 && (
        <MenuItem
          lucideId='PinOff'
          name='Unfreeze columns'
          onClick={() => onFrozenColumnsChange(1)}
        />
      )}
      {canDeleteColumn && (
        <MenuItem
          lucideId='Trash'
          name='Delete'
          onClick={() => onDeleteClick()}
        />
      )}
      {columnType !== CellType.EMBED &&
        columnType !== CellType.NUMBER &&
        columnType !== CellType.SOURCE && (
          <>
            <Divider />
            <Padding px='lg' py='md'>
              <Flex justify='space-between' align='center'>
                <Text value='Wrap content' />
                <Switch
                  value={shouldWrapOverflow}
                  onToggle={(value) =>
                    onWrapOverflowToggle(columnId, value)
                  }
                />
              </Flex>
            </Padding>
          </>
        )}
    </Stack>
  );
}

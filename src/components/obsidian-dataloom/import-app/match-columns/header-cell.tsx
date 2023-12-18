import Stack from 'src/components/obsidian-dataloom/shared/stack';
import Text from 'src/components/obsidian-dataloom/shared/text';
import Icon from 'src/components/obsidian-dataloom/shared/icon';
import MenuButton from 'src/components/obsidian-dataloom/shared/menu-button';

import { useOverflow } from 'src/components/obsidian-dataloom/shared/spacing/hooks';
import { ColumnMatch } from '../types';
import { LoomMenuLevel } from 'src/components/obsidian-dataloom/shared/menu-provider/types';
import { useMenu } from 'src/components/obsidian-dataloom/shared/menu-provider/hooks';
import { Column } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';
import MatchColumnMenu from './match-column-menu';

interface Props {
  isDisabled: boolean;
  columns: Column[];
  columnMatches: ColumnMatch[];
  index: number;
  importValue: string;
  matchId: string | null;
  onColumnEnabledToggle: (index: number) => void;
  onColumnMatch: (index: number, columnId: string | null) => void;
}

export default function HeaderCell({
  isDisabled,
  columns,
  columnMatches,
  index,
  importValue,
  matchId,
  onColumnMatch,
  onColumnEnabledToggle,
}: Props) {
  const overflowClassName = useOverflow(false, {
    ellipsis: true,
  });

  const COMPONENT_ID = `header-cell-${index}`;
  const menu = useMenu(COMPONENT_ID);

  function handleColumnClick(columnId: string | null) {
    onColumnMatch(index, columnId);
    menu.onClose();
  }

  return (
    <>
      <th className={overflowClassName}>
        <Stack
          className={isDisabled ? 'dataloom-disabled' : undefined}
          isHorizontal
          justify='space-between'
          spacing='xl'
          width='100%'
        >
          <Stack isHorizontal spacing='sm'>
            <Text value={importValue} />
            <Icon
              color={matchId ? 'green' : 'red'}
              ariaLabel={
                matchId !== null ? 'Matched' : 'Unmatched'
              }
              lucideId={
                matchId !== null
                  ? 'shield-check'
                  : 'shield-question'
              }
              size='xl'
            />
          </Stack>
          <Stack isHorizontal spacing='sm'>
            <input
              aria-label={
                isDisabled ? 'Enable column' : 'Disable column'
              }
              type='checkbox'
              checked={!isDisabled}
              onChange={() => onColumnEnabledToggle(index)}
            />
            <MenuButton
              ref={menu.triggerRef}
              isFocused={menu.isTriggerFocused}
              menuId={menu.id}
              level={LoomMenuLevel.ONE}
              ariaLabel='Match column'
              icon={<Icon lucideId='Columns' size='lg' />}
              onOpen={() =>
                menu.onOpen(LoomMenuLevel.ONE, {
                  shouldFocusTriggerOnClose: false,
                })
              }
            />
          </Stack>
        </Stack>
      </th>
      <MatchColumnMenu
        id={menu.id}
        isOpen={menu.isOpen}
        position={menu.position}
        selectedColumnId={matchId}
        columnMatches={columnMatches}
        columns={columns}
        onColumnClick={handleColumnClick}
      />
    </>
  );
}

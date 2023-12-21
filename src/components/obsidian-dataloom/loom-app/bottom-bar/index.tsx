import React from 'react';

import _ from 'lodash';

import NewRowButton from '../new-row-button';
import Stack from 'src/components/obsidian-dataloom/shared/stack';
import Button from 'src/components/obsidian-dataloom/shared/button';
import Flex from 'src/components/obsidian-dataloom/shared/flex';
import Padding from 'src/components/obsidian-dataloom/shared/padding';
import Icon from 'src/components/obsidian-dataloom/shared/icon';

import { numToPx } from 'src/components/obsidian-dataloom/shared/conversion';

import './styles.css';
import SortBubbleList from '../option-bar/sort-bubble-list';
import ActiveFilterBubble from '../option-bar/active-filter-bubble';
import {Column, Filter, SortDir} from '../../shared/loom-state/types/loom-state';
import {ColumnChangeHandler} from '../app/hooks/use-column/types';

interface Props {
  columns: Column[];
  filters: Filter[];
  onScrollToTopClick: () => void;
  onScrollToBottomClick: () => void;
  onUndoClick: () => void;
  onRedoClick: () => void;
  onRowAddClick: () => void;
  onColumnChange: ColumnChangeHandler;
}

export default function BottomBar({
  columns,
  filters,
  onColumnChange,
  onRowAddClick,
  onScrollToTopClick,
  onScrollToBottomClick,
  onUndoClick,
  onRedoClick,
}: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [bottomBarOffset, setBottomBarOffset] = React.useState(0);
  const isMobile = false;

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const appEl = el.closest('.dataloom-app');
    if (!appEl) return;

    const tableEl = appEl.querySelector(
      '.dataloom-table'
    ) as HTMLElement | null;
    if (!tableEl) return;

    const tableContainerEl = tableEl.parentElement;
    if (!tableContainerEl) return;

    function updateBottomBar(
      tableEl: HTMLElement,
      tableContainerEl: HTMLElement
    ) {
      const tableRect = tableEl.getBoundingClientRect();
      const tableContainerRect = tableContainerEl.getBoundingClientRect();

      let diff = tableContainerRect.height - tableRect.height;
      if (diff < 0) diff = 0;
      setBottomBarOffset(diff);
    }

    const THROTTLE_TIME_MILLIS = 50;
    const throttleUpdate = _.throttle(
      updateBottomBar,
      THROTTLE_TIME_MILLIS
    );

    const observer = new ResizeObserver(() => {
      throttleUpdate(tableEl, tableContainerEl);
    });

    observer.observe(tableEl);

    return () => {
      observer.disconnect();
    };
  }, []);

  let className = 'dataloom-bottom-bar';
  if (isMobile) {
    className += ' dataloom-bottom-bar--mobile';
  }
  function handleRemoveClick(columnId: string) {
    onColumnChange(
      columnId,
      { sortDir: SortDir.NONE },
      {
        shouldSortRows: true,
      }
    );
  }
  const activeFilters = filters.filter((filter) => filter.isEnabled);

  const sortedColumns = columns.filter(
    (column) => column.sortDir !== SortDir.NONE
  );

  return (
    <div ref={ref} className={className}>
      <div
        style={{
          top: numToPx(-bottomBarOffset),
        }}
      >
        <Padding pt='md' width='100%'>
          <Stack spacing='sm'>
            <Flex justify='space-between'>
              <NewRowButton onClick={onRowAddClick} />
              <Stack isHorizontal spacing='sm'>
                <SortBubbleList
                  sortedColumns={sortedColumns}
                  onRemoveClick={handleRemoveClick}
                />
                <ActiveFilterBubble
                  numActive={activeFilters.length}
                />
                <Button
                  ariaLabel='Scroll to top'
                  icon={<Icon lucideId='ChevronUp' />}
                  onClick={onScrollToTopClick}
                />
                <Button
                  ariaLabel='Scroll to bottom'
                  onClick={onScrollToBottomClick}
                  icon={<Icon lucideId='ChevronDown' />}
                />
              </Stack>
            </Flex>
            {isMobile && (
              <Flex justify='space-between'>
                <Button
                  ariaLabel='Undo'
                  size='lg'
                  icon={<Icon lucideId='Undo' />}
                  onClick={onUndoClick}
                />
                <Button
                  ariaLabel='Redo'
                  size='lg'
                  icon={<Icon lucideId='Redo' />}
                  onClick={onRedoClick}
                />
              </Flex>
            )}
          </Stack>
        </Padding>
      </div>
    </div>
  );
}

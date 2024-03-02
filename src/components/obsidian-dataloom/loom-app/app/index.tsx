import React, {useEffect, useState} from 'react';

import { VirtuosoHandle } from 'react-virtuoso';

import Table from '../table';
import OptionBar from '../option-bar';
import BottomBar from '../bottom-bar';

import { useLoomState } from '../loom-state-provider';
import { useFilter } from './hooks/use-filter';
import { filterRowsBySearch } from './filter-by-search';
import { useColumn } from './hooks/use-column';
import { useRow } from './hooks/use-row';
import { useCell } from './hooks/use-cell';
import { useTag } from './hooks/use-tag';
import { useAppMount } from '../app-mount-provider';
import { useExportEvents } from './hooks/use-export-events';
import { useRowEvents } from './hooks/use-row-events';
import { useColumnEvents } from './hooks/use-column-events';
import { useTableSettings } from './hooks/use-table-settings';
import useFocus from './hooks/use-focus';
import $ from 'jquery';

import {
  isMacRedoDown,
  isMacUndoDown,
  isWindowsRedoDown,
  isWindowsUndoDown,
} from '../../shared/keyboard-event';
import { useLogger } from '../../shared/logger';

import '../../global.css';
import './styles.css';
import { useAppEvents } from './hooks/use-app-events';
import { useMenuEvents } from './hooks/use-menu-events';
import {SpecialBlock} from '../../../../share/components/Block/SpecialBlock';

export default function App() {
  const logger = useLogger();
  const { path, session, collapse, title, reactAppId, isMarkdownView, forSetting} = useAppMount();
  const tableRef = React.useRef<VirtuosoHandle | null>(null);
  const { loomState, resizingColumnId, searchText, onRedo, onUndo } =
    useLoomState();
  const [height, setHeight] = useState(window.innerHeight);
  useEffect(() => {
    setTimeout(() => {
      const loomTable = $(`#${reactAppId} .dataloom-table`).get(0);
      const loomBottomBar = $(`#${reactAppId} .dataloom-bottom-bar`).get(0);
      setHeight(Math.min(loomTable!.offsetHeight + loomBottomBar!.offsetHeight || window.innerHeight * 0.8, window.innerHeight * 0.8));
    }, 100);
  }, [loomState]);
  useExportEvents(loomState);
  useRowEvents();
  useColumnEvents();
  useMenuEvents();
  const { onClick } = useAppEvents();
  const { onFocusKeyDown } = useFocus();
  const { onFrozenColumnsChange, onCalculationRowToggle } =
    useTableSettings();

  const { onFilterAdd, onFilterUpdate, onFilterDelete, filterByFilters } =
    useFilter();

  const {
    onColumnDeleteClick,
    onColumnAddClick,
    onColumnTypeChange,
    onColumnChange,
    onColumnReorder,
  } = useColumn();

  const {
    onRowAddClick,
    onRowDeleteClick,
    onRowInsertAboveClick,
    onRowInsertBelowClick,
    onRowReorder,
  } = useRow();

  const { onCellChange } = useCell();

  const {
    onTagCellAdd,
    onTagAdd,
    onTagCellRemove,
    onTagCellMultipleRemove,
    onTagDeleteClick,
    onTagChange,
  } = useTag();

  const { columns, filters, settings, sources } = loomState.model;
  const { numFrozenColumns, showCalculationRow } = settings;

  function handleScrollToTopClick() {
    tableRef.current?.scrollToIndex(0);
  }

  function handleScrollToBottomClick() {
    tableRef.current?.scrollToIndex(filteredRows.length - 1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    logger('App handleKeyDown');
    // Stop propagation to the global event
    e.stopPropagation();
    if (isWindowsRedoDown(e) || isMacRedoDown(e)) {
      // Prevent Obsidian action bar from triggering
      e.preventDefault();
      onRedo();
    } else if (isWindowsUndoDown(e) || isMacUndoDown(e)) {
      // Prevent Obsidian action bar from triggering
      e.preventDefault();
      onUndo();
    } else {
      onFocusKeyDown(e);
    }
  }

  let filteredRows = filterByFilters(loomState);
  filteredRows = filterRowsBySearch(
    sources,
    columns,
    filteredRows,
    searchText
  );

  let className = 'dataloom-app';
  if (isMarkdownView) {
    className += ' dataloom-app--markdown-view';
  }
  return (
    <SpecialBlock key={'dataloom-block'}
                  path={path}
                  title={title}
                  forSetting={forSetting}
                  tools={
                    <div
                      onMouseEnter={() => {
                        session.stopAnchor();
                        session.stopKeyMonitor('dataloom-option-bar');
                      }}
                      onMouseLeave={() => {
                        session.startKeyMonitor();
                      }}
                    >
                      <OptionBar
                        columns={columns}
                        sources={sources}
                        filters={filters}
                        showCalculationRow={showCalculationRow}
                        onColumnChange={onColumnChange}
                        onFilterAddClick={onFilterAdd}
                        onFilterDeleteClick={onFilterDelete}
                        onFilterUpdate={onFilterUpdate}
                        onCalculationRowToggle={onCalculationRowToggle}
                      />
                    </div>
                  }
                  collapse={collapse}
                  blockType={'DataLoom'}
                  session={session}
    >
      <div
        style={{height: height}}
        tabIndex={0}
        id={reactAppId}
        className={className}
        onKeyDown={handleKeyDown}
        onClick={onClick}
      >
        <Table
          ref={tableRef}
          sources={sources}
          rows={filteredRows}
          columns={columns}
          numFrozenColumns={numFrozenColumns}
          resizingColumnId={resizingColumnId}
          showCalculationRow={showCalculationRow}
          onColumnDeleteClick={onColumnDeleteClick}
          onColumnAddClick={onColumnAddClick}
          onColumnTypeChange={onColumnTypeChange}
          onFrozenColumnsChange={onFrozenColumnsChange}
          onColumnReorder={onColumnReorder}
          onRowDeleteClick={onRowDeleteClick}
          onRowInsertAboveClick={onRowInsertAboveClick}
          onRowInsertBelowClick={onRowInsertBelowClick}
          onColumnChange={onColumnChange}
          onCellChange={onCellChange}
          onTagAdd={onTagAdd}
          onTagCellAdd={onTagCellAdd}
          onTagCellRemove={onTagCellRemove}
          onTagCellMultipleRemove={onTagCellMultipleRemove}
          onTagChange={onTagChange}
          onTagDeleteClick={onTagDeleteClick}
          onRowReorder={onRowReorder}
        />
        <BottomBar
          filters={filters}
          columns={columns}
          onColumnChange={onColumnChange}
          onRowAddClick={onRowAddClick}
          onScrollToTopClick={handleScrollToTopClick}
          onScrollToBottomClick={handleScrollToBottomClick}
          onUndoClick={onUndo}
          onRedoClick={onRedo}
        />
      </div>
    </SpecialBlock>
  );
}

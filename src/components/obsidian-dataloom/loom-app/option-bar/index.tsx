import Stack from '../../shared/stack';
import SearchBar from './search-bar';
import ActiveFilterBubble from './active-filter-bubble';
import Padding from 'src/components/obsidian-dataloom/shared/padding';
import Icon from 'src/components/obsidian-dataloom/shared/icon';
import MenuButton from 'src/components/obsidian-dataloom/shared/menu-button';
import MoreMenu from './more-menu';
import FilterMenu from './filter-menu';
import SortBubbleList from './sort-bubble-list';
import SourcesMenu from './sources-menu';

import {
  SortDir,
  Column,
  Filter,
  Source,
  FilterCondition,
} from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';
import { isSmallScreenSize } from 'src/components/obsidian-dataloom/shared/render/utils';
import { ColumnChangeHandler } from '../app/hooks/use-column/types';
import { SourceAddHandler } from '../app/hooks/use-source/types';
import { LoomMenuLevel } from 'src/components/obsidian-dataloom/shared/menu-provider/types';
import { useMenu } from 'src/components/obsidian-dataloom/shared/menu-provider/hooks';

import './styles.css';
import { Space } from 'antd';

interface Props {
  columns: Column[];
  filters: Filter[];
  sources: Source[];
  showCalculationRow: boolean;
  onFilterUpdate: (
    filterId: string,
    data: Partial<Filter>,
    isPartial?: boolean
  ) => void;
  onFilterDeleteClick: (filterId: string) => void;
  onFilterAddClick: () => void;
  onCalculationRowToggle: (value: boolean) => void;
  onSourceAdd: SourceAddHandler;
  onSourceDelete: (id: string) => void;
  onColumnChange: ColumnChangeHandler;
  onSourceUpdate: (id: string, data: Partial<Source>) => void;
}
export default function OptionBar({
  columns,
  filters,
  sources,
  showCalculationRow,
  onFilterUpdate,
  onFilterDeleteClick,
  onFilterAddClick,
  onCalculationRowToggle,
  onSourceAdd,
  onSourceDelete,
  onColumnChange,
  onSourceUpdate,
}: Props) {
  const COMPONENT_ID = 'option-bar';
  const SOURCE_MENU_ID = 'sources-menu';
  const MORE_MENU_ID = 'more-menu';
  const FILTER_MENU_ID = 'filter-menu';

  const sourcesMenu = useMenu(COMPONENT_ID, { name: SOURCE_MENU_ID });
  const moreMenu = useMenu(COMPONENT_ID, { name: MORE_MENU_ID });
  const filterMenu = useMenu(COMPONENT_ID, { name: FILTER_MENU_ID });

  //  TODO re-enable
  //  const previousLength = usePrevious(filterRules.length);
  //  React.useEffect(() => {
  //    if (previousLength !== undefined) {
  //      if (previousLength < filterRules.length) {
  //        if (filterMenuRef.current) {
  //          // Scroll to the bottom if we're adding a new filter
  //          filterMenuRef.current.scrollTop =
  //            filterMenuRef.current.scrollHeight;
  //        }
  //      }
  //    }
  //  }, [previousLength, filterRules.length, filterMenuRef]);

  function handleColumnToggle(columnId: string, isVisible: boolean) {
    onColumnChange(columnId, { isVisible });
  }

  function handleSourceFilterConditionChange(
    sourceId: string,
    value: FilterCondition
  ) {
    onSourceUpdate(sourceId, { filterCondition: value });
  }

  function handleSourceFilterTextChange(sourceId: string, value: string) {
    onSourceUpdate(sourceId, { filterText: value });
  }

  function handleSourceMenuOpen() {
    sourcesMenu.onOpen(LoomMenuLevel.ONE);
  }

  function handleFilterMenuOpen() {
    filterMenu.onOpen(LoomMenuLevel.ONE);
    if (filters.length === 0) {
      onFilterAddClick();
    }
  }

  function handleMoreMenuOpen() {
    moreMenu.onOpen(LoomMenuLevel.ONE);
  }

  function handleFilterDelete(id: string) {
    onFilterDeleteClick(id);

    // Close the menu when the last filter is deleted
    if (filters.length === 1) {
      filterMenu.onClose();
    }
  }

  const isSmallScreen = isSmallScreenSize();
  return (
    <>
      <div className='dataloom-option-bar'>
        <Space direction={'horizontal'} size={0}>
          {isSmallScreen === false && (
            <MenuButton
              isFocused={filterMenu.isTriggerFocused}
              menuId={filterMenu.id}
              ref={filterMenu.triggerRef}
              level={LoomMenuLevel.ONE}
              icon={<Icon lucideId='Filter' />}
              onOpen={handleFilterMenuOpen}
            />
          )}
          <SearchBar />
          <MenuButton
            isFocused={moreMenu.isTriggerFocused}
            menuId={moreMenu.id}
            ref={moreMenu.triggerRef}
            level={LoomMenuLevel.ONE}
            icon={<Icon lucideId='MoreVertical' />}
            onOpen={handleMoreMenuOpen}
          />
        </Space>
      </div>
      <SourcesMenu
        id={sourcesMenu.id}
        isOpen={sourcesMenu.isOpen}
        position={sourcesMenu.position}
        sources={sources}
        columns={columns}
        onSourceAdd={onSourceAdd}
        onSourceDelete={onSourceDelete}
        onSourceFilterConditionChange={
          handleSourceFilterConditionChange
        }
        onSourceFilterTextChange={handleSourceFilterTextChange}
        onClose={sourcesMenu.onClose}
      />
      <MoreMenu
        id={moreMenu.id}
        isOpen={moreMenu.isOpen}
        showCalculationRow={showCalculationRow}
        position={moreMenu.position}
        columns={columns}
        onFilterClick={handleFilterMenuOpen}
        onColumnToggle={handleColumnToggle}
        onCalculationRowToggle={onCalculationRowToggle}
        onClose={moreMenu.onClose}
        onSourcesClick={handleSourceMenuOpen}
      />
      <FilterMenu
        id={filterMenu.id}
        isOpen={filterMenu.isOpen}
        position={
          isSmallScreen ? moreMenu.position : filterMenu.position
        }
        columns={columns}
        filters={filters}
        onUpdate={onFilterUpdate}
        onDeleteClick={handleFilterDelete}
        onAddClick={onFilterAddClick}
      />
    </>
  );
}

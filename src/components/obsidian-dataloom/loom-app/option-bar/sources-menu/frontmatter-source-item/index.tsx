import Bubble from 'src/components/obsidian-dataloom/shared/bubble';
import Button from 'src/components/obsidian-dataloom/shared/button';
import Icon from 'src/components/obsidian-dataloom/shared/icon';
import Select from 'src/components/obsidian-dataloom/shared/select';
import FilterInput from '../add-source-submenu/filter-input';
import SourceItem from '../source-item';
import Wrap from 'src/components/obsidian-dataloom/shared/wrap';
import Flex from 'src/components/obsidian-dataloom/shared/flex';

import { getIconIdForSourceType } from 'src/components/obsidian-dataloom/shared/icon/utils';
import {
  DateFilterCondition,
  FilterCondition,
  NumberFilterCondition,
  SourceType,
  TextFilterCondition,
} from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';
import { getDisplayNameForFilterCondition } from 'src/components/obsidian-dataloom/shared/loom-state/type-display-names';
import { ObsidianPropertyType } from 'src/components/obsidian-dataloom/shared/frontmatter/types';

interface Props {
  id: string;
  title: string;
  type: SourceType;
  selectedPropertyType: ObsidianPropertyType;
  selectedFilterCondition: FilterCondition | null;
  filterConditions: FilterCondition[];
  filterText: string;
  onDelete: (id: string) => void;
  onFilterConditionChange: (id: string, value: FilterCondition) => void;
  onFilterTextChange: (id: string, value: string) => void;
}

export default function FrontmatterSourceItem({
  filterConditions,
  filterText,
  id,
  title,
  selectedPropertyType,
  selectedFilterCondition,
  type,
  onDelete,
  onFilterConditionChange,
  onFilterTextChange,
}: Props) {
  const showFilterInput =
    selectedFilterCondition !== TextFilterCondition.IS_EMPTY &&
    selectedFilterCondition !== TextFilterCondition.IS_NOT_EMPTY &&
    selectedFilterCondition !== DateFilterCondition.IS_EMPTY &&
    selectedFilterCondition !== DateFilterCondition.IS_NOT_EMPTY &&
    selectedFilterCondition !== NumberFilterCondition.IS_NOT_EMPTY &&
    selectedFilterCondition !== NumberFilterCondition.IS_EMPTY;

  return (
    <SourceItem>
      <div className='dataloom-frontmatter-source-item'>
        <Wrap>
          <Bubble
            icon={
              <Icon
                lucideId={getIconIdForSourceType(type, {
                  propertyType: selectedPropertyType,
                })}
              />
            }
            variant='no-fill'
            value={title}
          />
          <Select
            value={selectedFilterCondition ?? ""}
            onChange={(value) =>
              onFilterConditionChange(
                id,
                (value as FilterCondition) || null
              )
            }
          >
            {Object.values(filterConditions).map((type) => {
              return (
                <option key={type} value={type}>
                  {getDisplayNameForFilterCondition(type)}
                </option>
              );
            })}
          </Select>
          {showFilterInput && (
            <FilterInput
              selectedPropertyType={selectedPropertyType}
              filterText={filterText}
              onFilterTextChange={(value) =>
                onFilterTextChange(id, value)
              }
            />
          )}
          <Flex width='fit-content' grow justify='flex-end'>
            <Button
              icon={<Icon lucideId='Trash' />}
              ariaLabel='Delete source'
              onClick={() => onDelete(id)}
            />
          </Flex>
        </Wrap>
      </div>
    </SourceItem>
  );
}

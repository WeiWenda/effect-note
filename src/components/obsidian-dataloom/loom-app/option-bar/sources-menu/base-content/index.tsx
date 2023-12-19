import {
  FilterCondition,
  Source,
  SourceType,
} from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';
import Stack from 'src/components/obsidian-dataloom/shared/stack';

import './styles.css';
import Button from 'src/components/obsidian-dataloom/shared/button';
import Icon from 'src/components/obsidian-dataloom/shared/icon';
import { getFilterConditionsForPropertyType } from '../add-source-submenu/utils';
import FolderSourceItem from '../folder-source-item';
import FrontmatterSourceItem from '../frontmatter-source-item';

interface Props {
  sources: Source[];
  onSourceAdd: () => void;
  onSourceDelete: (id: string) => void;
  onSourceFilterConditionChange: (id: string, value: FilterCondition) => void;
  onSourceFilterTextChange: (id: string, value: string) => void;
}

export default function BaseContent({
  sources,
  onSourceAdd,
  onSourceDelete,
  onSourceFilterConditionChange,
  onSourceFilterTextChange,
}: Props) {
  return (
    <Stack spacing='md'>
      <Stack spacing='md'>
        {sources.map((source) => {
          const { id, type } = source;

          if (type === SourceType.FOLDER) {
            const { path } = source;
            return (
              <FolderSourceItem
                key={id}
                id={id}
                content={path}
                type={type}
                onDelete={onSourceDelete}
              />
            );
          } else if (type === SourceType.FRONTMATTER) {
            const {
              filterCondition,
              filterText,
              propertyType,
              propertyKey,
            } = source;
            const filterConditions =
              getFilterConditionsForPropertyType(propertyType);
            return (
              <FrontmatterSourceItem
                key={id}
                id={id}
                title={propertyKey}
                type={type}
                onDelete={onSourceDelete}
                selectedFilterCondition={filterCondition}
                filterConditions={filterConditions}
                filterText={filterText}
                selectedPropertyType={propertyType}
                onFilterConditionChange={
                  onSourceFilterConditionChange
                }
                onFilterTextChange={onSourceFilterTextChange}
              />
            );
          } else {
            throw new Error('Unhandled source type');
          }
        })}
      </Stack>
      <Button
        icon={<Icon lucideId='Plus'></Icon>}
        onClick={() => onSourceAdd()}
        ariaLabel='Add source'
      />
    </Stack>
  );
}

import Icon from 'src/components/obsidian-dataloom/shared/icon';
import Button from 'src/components/obsidian-dataloom/shared/button';
import Switch from 'src/components/obsidian-dataloom/shared/switch';
import Wrap from 'src/components/obsidian-dataloom/shared/wrap';
import Stack from 'src/components/obsidian-dataloom/shared/stack';
import FilterColumnSelect from '../filter-column-select';

import {
  Column,
  FilterCondition,
  FilterOperator as FilterOperatorType,
  TextFilterCondition,
} from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';
import FilterConditionSelect from '../filter-condition-select';

import './styles.css';
import FilterOperator from '../filter-operator';

interface Props {
  index: number;
  id: string;
  columns: Column[];
  isEnabled: boolean;
  selectedColumnId: string;
  selectedOperator: FilterOperatorType;
  conditionOptions: FilterCondition[];
  selectedCondition: FilterCondition;
  inputNode?: React.ReactNode;
  useSpacer?: boolean;
  onToggle: (id: string) => void;
  onColumnChange: (id: string, columnId: string) => void;
  onConditionChange: (id: string, value: FilterCondition) => void;
  onOperatorChange: (id: string, value: FilterOperatorType) => void;
  onDeleteClick: (id: string) => void;
  children?: React.ReactNode;
}

export default function FilterRow({
  index,
  id,
  columns,
  useSpacer,
  isEnabled,
  selectedColumnId,
  selectedOperator,
  selectedCondition,
  conditionOptions,
  inputNode,
  onToggle,
  onColumnChange,
  onOperatorChange,
  onConditionChange,
  onDeleteClick,
}: Props) {
  return (
    <div className='dataloom-filter-row'>
      <Wrap>
        {index !== 0 && (
          <FilterOperator
            id={id}
            value={selectedOperator}
            onChange={onOperatorChange}
          />
        )}
        {useSpacer && (
          <div className='dataloom-filter-row__spacer'></div>
        )}

        <FilterColumnSelect
          id={id}
          columns={columns}
          value={selectedColumnId}
          onChange={onColumnChange}
        />
        <FilterConditionSelect
          id={id}
          options={conditionOptions}
          value={selectedCondition}
          onChange={onConditionChange}
        />
        {selectedCondition !== TextFilterCondition.IS_EMPTY &&
          selectedCondition !== TextFilterCondition.IS_NOT_EMPTY && (
            <div className='dataloom-filter-row__input'>
              {inputNode}
            </div>
          )}
        <Stack
          grow
          justify='flex-end'
          align='center'
          spacing='lg'
          isHorizontal
        >
          <Button
            icon={<Icon lucideId='Trash2' />}
            ariaLabel='Delete filter'
            onClick={() => onDeleteClick(id)}
          />
          <Switch
            value={isEnabled}
            ariaLabel={
              isEnabled ? 'Disable filter' : 'Enable filter'
            }
            onToggle={() => onToggle(id)}
          />
        </Stack>
      </Wrap>
    </div>
  );
}

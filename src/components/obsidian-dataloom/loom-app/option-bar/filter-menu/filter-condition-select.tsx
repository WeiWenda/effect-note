import Select from 'src/components/obsidian-dataloom/shared/select';
import { getDisplayNameForFilterCondition } from 'src/components/obsidian-dataloom/shared/loom-state/type-display-names';
import { FilterCondition } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';

interface Props {
  id: string;
  options: FilterCondition[];
  value: FilterCondition;
  onChange: (id: string, value: FilterCondition) => void;
}

export default function FilterConditionSelect({
  id,
  value,
  options,
  onChange,
}: Props) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  }

  return (
    <Select
      value={value}
      onKeyDown={handleKeyDown}
      onChange={(newValue) => onChange(id, newValue as FilterCondition)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {getDisplayNameForFilterCondition(option)}
        </option>
      ))}
    </Select>
  );
}

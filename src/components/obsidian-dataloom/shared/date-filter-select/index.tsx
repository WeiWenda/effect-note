import Select from '../select';
import { getDisplayNameForDateFilterOption } from '../loom-state/type-display-names';
import { DateFilterOption } from '../loom-state/types/loom-state';

interface Props {
  value: DateFilterOption;
  onChange: (value: DateFilterOption) => void;
}

export default function DateFilterSelect({ value, onChange }: Props) {
  return (
    <Select
      value={value}
      onChange={(value) => onChange(value as DateFilterOption)}
    >
      {Object.values(DateFilterOption).map((option) => (
        <option key={option} value={option}>
          {getDisplayNameForDateFilterOption(option)}
        </option>
      ))}
    </Select>
  );
}

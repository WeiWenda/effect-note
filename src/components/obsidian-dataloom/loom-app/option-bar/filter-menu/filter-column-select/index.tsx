import Select from 'src/components/obsidian-dataloom/shared/select';
import { CellType, Column } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';

interface Props {
  id: string;
  columns: Column[];
  value: string;
  onChange: (id: string, columnId: string) => void;
}

export default function FilterColumnSelect({
  id,
  columns,
  value,
  onChange,
}: Props) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
      //Stop propagation so the the menu doesn't close when pressing enter
      e.stopPropagation();
    }
  }

  return (
    <Select
      className='dataloom-filter-column-select'
      value={value}
      onKeyDown={handleKeyDown}
      onChange={(newValue) => onChange(id, newValue)}
    >
      {columns
        .filter((column) => column.type !== CellType.SOURCE)
        .map((column) => {
          const { id, content } = column;
          return (
            <option key={id} value={id}>
              {content}
            </option>
          );
        })}
    </Select>
  );
}

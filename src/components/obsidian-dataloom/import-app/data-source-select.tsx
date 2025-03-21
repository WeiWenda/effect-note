import { DataSource } from './types';
import Stack from 'src/components/obsidian-dataloom/shared/stack';

interface Props {
  value: DataSource;
  onChange: (value: DataSource) => void;
}

export default function DataSourceSelect({ value, onChange }: Props) {
  return (
    <div className='dataloom-data-source-select'>
      <Stack>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as DataSource)}
        >
          {Object.values(DataSource).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Stack>
    </div>
  );
}

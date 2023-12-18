import { Cell } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';

export type CellChangeHandler = (
  id: string,
  data: Partial<Cell>,
  isPartial?: boolean
) => void;

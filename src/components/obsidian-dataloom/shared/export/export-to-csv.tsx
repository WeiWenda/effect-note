import Papa from 'papaparse';

import { loomStateToArray } from './loom-state-to-array';
import { LoomState } from '../loom-state/types/loom-state';

export const exportToCSV = (
  loomState: LoomState,
  shouldRemoveMarkdown: boolean
): string => {
  const arr = loomStateToArray(loomState, shouldRemoveMarkdown);
  return Papa.unparse(arr);
};

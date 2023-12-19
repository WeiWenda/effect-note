import { LoomState } from '../loom-state/types/loom-state';
import { markdownTable } from 'markdown-table';
import { loomStateToArray } from './loom-state-to-array';
import { escapePipeCharacters } from './export-utils';

export const exportToMarkdown = (
  loomState: LoomState,
  shouldRemoveMarkdown: boolean
): string => {
  const arr = loomStateToArray(loomState, shouldRemoveMarkdown);
  // Markdown table cells can't contain pipe characters, so we escape them
  // Obsidian will render the escaped pipe characters as normal pipe characters
  const escapedArr = arr.map((row) =>
    row.map((cell) => escapePipeCharacters(cell))
  );
  return markdownTable(escapedArr);
};

import {
  createCellForType,
  createRow,
} from 'src/components/obsidian-dataloom/shared/loom-state/loom-state-factory';
import LoomStateCommand from './loom-state-command';
import { Row, LoomState } from '../types/loom-state';

export default class RowAddCommand extends LoomStateCommand {
  constructor() {
    super(true);
  }

  execute(prevState: LoomState): LoomState {
    const { rows, columns } = prevState.model;

    const cells = columns.map((column) => {
      const { id, type } = column;
      return createCellForType(id, type);
    });
    const addedRow = createRow(rows.length, { cells });

    const nextState = {
      ...prevState,
      model: {
        ...prevState.model,
        rows: [...rows, addedRow],
      },
    };
    this.finishExecute(prevState, nextState);
    return nextState;
  }
}

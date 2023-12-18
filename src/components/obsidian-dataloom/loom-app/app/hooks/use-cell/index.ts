import { useLogger } from 'src/components/obsidian-dataloom/shared/logger';
import { useLoomState } from 'src/components/obsidian-dataloom/loom-app/loom-state-provider';
import CellBodyUpdateCommand from 'src/components/obsidian-dataloom/shared/loom-state/commands/cell-body-update-command';
import { Cell } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';
import React from 'react';

export const useCell = () => {
  const logger = useLogger();
  const { doCommand } = useLoomState();

  const handleCellChange = React.useCallback(
    (id: string, value: Partial<Cell>, isPartial = true) => {
      logger('handleCellChange', {
        id,
        value,
        isPartial,
      });

      doCommand(new CellBodyUpdateCommand(id, value, isPartial));
    },
    [doCommand, logger]
  );

  return {
    onCellChange: handleCellChange,
  };
};

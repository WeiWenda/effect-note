import React from 'react';
import ColumnAddCommand from 'src/components/obsidian-dataloom/shared/loom-state/commands/column-add-command';
import ColumnDeleteCommand from 'src/components/obsidian-dataloom/shared/loom-state/commands/column-delete-command';
import { isEventForThisApp } from 'src/components/obsidian-dataloom/shared/event/utils';
import { useLogger } from 'src/components/obsidian-dataloom/shared/logger';
import { useLoomState } from 'src/components/obsidian-dataloom/loom-app/loom-state-provider';
import { useAppMount } from '../../app-mount-provider';
import EventManager from 'src/components/obsidian-dataloom/shared/event/event-manager';

export const useColumnEvents = () => {
  const { reactAppId, app } = useAppMount();
  const { doCommand } = useLoomState();
  const logger = useLogger();

  React.useEffect(() => {
    function handleColumnAddEvent() {
      if (isEventForThisApp(reactAppId)) {
        logger('handleColumnAddEvent');
        doCommand(new ColumnAddCommand());
      }
    }

    function handleColumnDeleteEvent() {
      if (isEventForThisApp(reactAppId)) {
        logger('handleColumnDeleteEvent');
        doCommand(new ColumnDeleteCommand({ last: true }));
      }
    }
    EventManager.getInstance().on('add-column', handleColumnAddEvent);
    EventManager.getInstance().on('delete-column', handleColumnDeleteEvent);

    return () => {
      EventManager.getInstance().off('add-column', handleColumnAddEvent);
      EventManager.getInstance().off(
        'delete-column',
        handleColumnDeleteEvent
      );
    };
  }, [doCommand, logger, reactAppId, app]);
};

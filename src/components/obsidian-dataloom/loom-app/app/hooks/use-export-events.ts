import React from 'react';
import { isEventForThisApp } from 'src/components/obsidian-dataloom/shared/event/utils';
import {
  getBlobTypeForExportType,
} from 'src/components/obsidian-dataloom/shared/export/download-utils';
import { exportToCSV } from 'src/components/obsidian-dataloom/shared/export/export-to-csv';
import { exportToMarkdown } from 'src/components/obsidian-dataloom/shared/export/export-to-markdown';
import { ExportType } from 'src/components/obsidian-dataloom/shared/export/types';
import { LoomState } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';
import { useAppMount } from '../../app-mount-provider';
import { useAppSelector } from 'src/components/obsidian-dataloom/redux/hooks';
import EventManager from 'src/components/obsidian-dataloom/shared/event/event-manager';
import {exportDataLoom} from '../../../../../plugins/links/dropdownMenu';

export const useExportEvents = (state: LoomState) => {
  const { reactAppId, session } = useAppMount();
  const { removeMarkdownOnExport } = useAppSelector(
    (state) => state.global.settings
  );

  React.useEffect(() => {
    function handleDownloadCSV() {
      if (isEventForThisApp(reactAppId)) {
        // Set timeout to wait for the command window to disappear
        setTimeout(() => {
          const data = exportToCSV(
            state,
            removeMarkdownOnExport
          );
          const blobType = getBlobTypeForExportType(ExportType.CSV);
          exportDataLoom(session, data, Number(reactAppId), blobType);
        }, 100);
      }
    }

    function handleDownloadMarkdown() {
      if (isEventForThisApp(reactAppId)) {
        // Set timeout to wait for the command window to disappear
        setTimeout(() => {
          const data = exportToMarkdown(
            state,
            removeMarkdownOnExport
          );
          const blobType = getBlobTypeForExportType(ExportType.MARKDOWN);
          exportDataLoom(session, data, Number(reactAppId), blobType);
        }, 100);
      }
    }

    EventManager.getInstance().on('download-csv', handleDownloadCSV);
    EventManager.getInstance().on(
      'download-markdown',
      handleDownloadMarkdown
    );

    return () => {
      EventManager.getInstance().off('download-csv', handleDownloadCSV);
      EventManager.getInstance().off(
        'download-markdown',
        handleDownloadMarkdown
      );
    };
  }, [state, reactAppId, removeMarkdownOnExport]);
};

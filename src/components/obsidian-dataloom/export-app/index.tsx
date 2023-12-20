import React from 'react';

import Stack from '../shared/stack';
import ExportTypeSelect from './export-type-select';
import ContentTextArea from './content-textarea';

import { LoomState } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';
import { ExportType } from '../shared/export/types';
import { exportToMarkdown } from 'src/components/obsidian-dataloom/shared/export/export-to-markdown';

import { exportToCSV } from 'src/components/obsidian-dataloom/shared/export/export-to-csv';
import { useAppSelector } from 'src/components/obsidian-dataloom/redux/hooks';

import './styles.css';
import Switch from '../shared/switch';
import {downloadFile} from '../../../ts/util';
import {useAppMount} from '../loom-app/app-mount-provider';
import {getBlobTypeForExportType} from '../shared/export/download-utils';

interface Props {
  loomState: LoomState;
}

export function ExportApp({ loomState }: Props) {
  const {session, reactAppId} = useAppMount();
  const [exportType, setExportType] = React.useState<ExportType>(
    ExportType.UNSELECTED
  );
  const { removeMarkdownOnExport } = useAppSelector(
    (state) => state.global.settings
  );
  const [shouldRemoveMarkdown, setRemoveMarkdown] = React.useState<boolean>(
    removeMarkdownOnExport
  );

  async function handleCopyClick(value: string) {
    await navigator.clipboard.writeText(value);
    session.showMessage('操作成功');
  }

  function handleDownloadClick() {
    console.log('handleDownloadClick');
    session.document.getText(Number(reactAppId)).then(blockContent => {
      downloadFile(`${blockContent ? blockContent : 'effect-note-export'}`, content, getBlobTypeForExportType(exportType));
    });
  }

  let content = '';
  if (exportType === ExportType.MARKDOWN) {
    content = exportToMarkdown(loomState, shouldRemoveMarkdown);
  } else if (exportType === ExportType.CSV) {
    content = exportToCSV(loomState, shouldRemoveMarkdown);
  }

  return (
    <div className='dataloom-export-app'>
      <Stack spacing='xl' width='100%'>
        <ExportTypeSelect value={exportType} onChange={setExportType} />
        {exportType !== ExportType.UNSELECTED && (
          <>
            <Stack spacing='sm'>
              <label htmlFor='remove-markdown'>
                Remove markdown
              </label>
              <Switch
                id='remove-markdown'
                value={shouldRemoveMarkdown}
                onToggle={() =>
                  setRemoveMarkdown((prevState) => !prevState)
                }
              />
            </Stack>
            <ContentTextArea value={content} />
            <Stack isHorizontal>
              <button
                className='mod-cta'
                onClick={handleDownloadClick}
              >
                Download
              </button>
              <button
                className='dataloom-copy-button'
                onClick={() => handleCopyClick(content)}
              >
                Copy to clipboard
              </button>
            </Stack>
          </>
        )}
      </Stack>
    </div>
  );
}

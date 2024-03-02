import Padding from 'src/components/obsidian-dataloom/shared/padding';
import MenuItem from 'src/components/obsidian-dataloom/shared/menu-item';
// import ExportModal from 'src/obsidian/modal/export-modal';
import AppMountProvider, { useAppMount } from '../../app-mount-provider';
import { Button, Modal } from 'antd';
import { Provider } from 'react-redux';
import { isSmallScreenSize } from 'src/components/obsidian-dataloom/shared/render/utils';
// import ImportModal from 'src/obsidian/modal/import-modal';
import { useLoomState } from '../../loom-state-provider';
import {ExportApp} from '../../../export-app';
import {store} from '../../../redux/store';
import { DownloadOutlined, ImportOutlined } from '@ant-design/icons';
import ImportApp from '../../../import-app';
import MenuProvider from '../../../shared/menu-provider';
import {serializeState} from '../../../data/serialize-state';

interface Props {
  onClose: () => void;
  onSettingsClick: () => void;
  onToggleColumnClick: () => void;
  onFilterClick: () => void;
  onSourcesClick: () => void;
}

export default function BaseContent({
  onToggleColumnClick,
  onFilterClick,
  onSettingsClick,
  onSourcesClick,
  onClose,
}: Props) {
  const {session, reactAppId, isMarkdownView, title, path, collapse} = useAppMount();
  const { loomState, setLoomState } = useLoomState();
  const isSmallScreen = isSmallScreenSize();
  return (
    <Padding p='sm'>
      {/*{isSmallScreen && (*/}
      {/*  <MenuItem*/}
      {/*    lucideId='Filter'*/}
      {/*    name='Sources'*/}
      {/*    onClick={onSourcesClick}*/}
      {/*  />*/}
      {/*)}*/}
      {isSmallScreen && (
        <MenuItem
          lucideId='Filter'
          name='Filter'
          onClick={onFilterClick}
        />
      )}
      <MenuItem
        lucideId='EyeOff'
        name='Toggle'
        onClick={onToggleColumnClick}
      />
      <MenuItem
        lucideId='Import'
        name='Import'
        onClick={() => {
          onClose();
          session.stopKeyMonitor('dataloom-import');
          Modal.confirm({
            afterClose: () => {
              session.startKeyMonitor();
            },
            width: 800,
            icon: (
              <ImportOutlined style={{color: session.clientStore.getClientSetting('theme-text-primary')}}/>
            ),
            maskClosable: true,
            title: 'DataLoom导入',
            footer: null,
            content: (
                <Provider store={store}>
                  <MenuProvider>
                    <ImportApp state={loomState} onStateChange={(state) => {
                      setLoomState({
                        state,
                        shouldSaveToDisk: false,
                        shouldSaveFrontmatter: true,
                        time: Date.now(),
                      });
                      Modal.destroyAll();
                    }}/>
                  </MenuProvider>
                </Provider>
            )
          });
          // new ImportModal(app, loomFile, loomState).open();
        }}
      />
      <MenuItem
        lucideId='Download'
        name='Export'
        onClick={() => {
          onClose();
          session.stopKeyMonitor('dataloom-export');
          Modal.confirm({
            afterClose: () => {
              session.startKeyMonitor();
            },
            width: 500,
            icon: (
              <DownloadOutlined style={{color: session.clientStore.getClientSetting('theme-text-primary')}}/>
            ),
            maskClosable: true,
            title: 'DataLoom导出',
            footer: null,
            content: (
              <AppMountProvider title={title}
                                path={path}
                                collapse={collapse}
                                forSetting={false}
                                session={session} reactAppId={reactAppId} isMarkdownView={isMarkdownView}>
                <Provider store={store}>
                 <ExportApp loomState={loomState}/>
                </Provider>
              </AppMountProvider>
            )
          });
          // new ExportModal(app, loomFile, loomState).open();
        }}
      />
      <MenuItem
        lucideId='Wrench'
        name='Settings'
        onClick={onSettingsClick}
      />
    </Padding>
  );
}

import {Provider} from 'react-redux';
import {Store} from '@reduxjs/toolkit';

import LoomStateProvider from './loom-state-provider';
import AppMountProvider from './app-mount-provider';
import App from './app';

import DragProvider from '../shared/dragging/drag-context';
import {LoomState} from '../shared/loom-state/types/loom-state';
import MenuProvider from '../shared/menu-provider';
import ErrorBoundary from '../shared/error-boundary';
import {Path, Session} from '../../../share';

interface Props {
  path: Path;
  title: string;
  collapse: boolean;
  session: Session;
  isMarkdownView: boolean;
  store: Store;
  forSetting: boolean;
  loomState: LoomState;
  onSaveState: (
    appId: string,
    state: LoomState,
    shouldSaveFrontmatter: boolean
  ) => void;
}

export default function LoomApp({
  path,
  title,
  collapse,
  session,
  isMarkdownView,
  store,
  forSetting,
  loomState,
  onSaveState,
}: Props) {
  return (
    <ErrorBoundary>
      <AppMountProvider
        title={title}
        collapse={collapse}
        session={session}
        path={path}
        reactAppId={path.row.toString()}
        isMarkdownView={isMarkdownView}
        forSetting={forSetting}
      >
        <Provider store={store}>
          <LoomStateProvider
            initialState={loomState}
            onSaveState={onSaveState}
          >
            <DragProvider>
              <MenuProvider>
                <App  />
              </MenuProvider>
            </DragProvider>
          </LoomStateProvider>
        </Provider>
      </AppMountProvider>
    </ErrorBoundary>
  );
}

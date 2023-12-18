import {Row, Session} from '../../share';
import Config from '../../share/ts/config';
import LoomApp from './loom-app';
import {store} from './redux/store';
import {LoomState} from './shared/loom-state/types';
import {createLoomState} from './shared/loom-state/loom-state-factory';

export function DataLoomComponent(props: {session: Session, row: Row}) {
  const pluginVersion = '8.15.10';
  const loomState = createLoomState(1, 1, {
    pluginVersion,
    frozenColumnCount: 1,
  });
  const handleSaveLoomState = async (
    appId: string,
    state: LoomState,
    shouldSaveFrontmatter: boolean) => {
      console.log('handleSaveLoomState', appId, state, shouldSaveFrontmatter);
  };
  return (
    <LoomApp
      session={props.session}
      reactAppId={props.row.toString()}
      isMarkdownView={false}
      store={store}
      loomState={loomState}
      onSaveState={handleSaveLoomState}
    />
  );
}

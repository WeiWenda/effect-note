import * as React from 'react'; // tslint:disable-line no-unused-variable
import {registerPlugin} from '../../ts/plugins';
import {linksPluginName} from '../links';
import {SpecialBlock} from '../../share/components/Block/SpecialBlock';
import {deserializeState, serializeState} from '../../components/obsidian-dataloom/data/serialize-state';
import {LoomState} from '../../components/obsidian-dataloom/shared/loom-state/types';
import {createLoomState} from '../../components/obsidian-dataloom/shared/loom-state/loom-state-factory';
import LoomApp from '../../components/obsidian-dataloom/loom-app';
import {store} from '../../components/obsidian-dataloom/redux/store';

registerPlugin(
  {
    name: 'DataLoom',
    author: 'Wei Wenda',
    description: 'Lets you inline dataloom content',
    dependencies: [linksPluginName],
  },
  function(api) {
    api.registerHook('session', 'renderAfterLine', (elements, {path, pluginData, line}) => {
      if (pluginData.links?.dataloom) {
        const dataloomPluginVersion = '8.15.10';
        let loomState: LoomState;
        if (pluginData.links.dataloom.content) {
          loomState = deserializeState(pluginData.links.dataloom.content, dataloomPluginVersion);
        } else {
          loomState = createLoomState(1, 1, {
            dataloomPluginVersion,
            frozenColumnCount: 1,
          });
        }
        elements.push(
            <LoomApp
              session={api.session}
              path={path}
              title={line.join('')}
              collapse={pluginData.links.collapse || false}
              isMarkdownView={false}
              store={store}
              loomState={loomState}
              onSaveState={async (
                appId: string,
                state: LoomState,
                shouldSaveFrontmatter: boolean) => {
                console.log('handleSaveLoomState', appId, state, shouldSaveFrontmatter);
                api.session.emit('setDataLoom', path.row, serializeState(state), '');
              }}
            />
        );
      }
      return elements;
    });
  },
  (api => api.deregisterAll()),
);

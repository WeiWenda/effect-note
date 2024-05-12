import * as React from 'react'; // tslint:disable-line no-unused-variable
import {registerPlugin} from '../../ts/plugins';
import {LinksPlugin, linksPluginName} from '../links';
import {SpecialBlock} from '../../share/components/Block/SpecialBlock';
import {copyToClipboard} from '../../components';
import {Input, Select, Space, Tooltip} from 'antd';
import {MonacoEditorWrapper} from './MonacoEditorWrapper';
import {EmitFn, PartialUnfolder, Token, Tokenizer} from '../../share';
import {getStyles} from '../../share/ts/themes';

registerPlugin(
  {
    name: 'CodeSnippet',
    author: 'Jeff Wu',
    description: 'Lets you inline markdown content',
    dependencies: [linksPluginName],
  },
  function(api) {
    const linksPlugin = api.getPlugin(linksPluginName) as LinksPlugin;
    api.registerHook('session', 'renderAfterLine', (elements, {path, pluginData, line}) => {
      if (pluginData.links?.code) {
        elements.push(
          <MonacoEditorWrapper
              session={api.session}
              title={line.join('')}
              path={path}
              pluginData={pluginData}
              theme={api.session.clientStore.getClientSetting('curTheme').includes('Dark') ? 'vs-dark' : 'vs-light'}
              lockEdit={api.session.lockEdit}
          />
        );
      }
      return elements;
    });
  },
  (api => api.deregisterAll()),
);

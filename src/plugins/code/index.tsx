import * as React from 'react'; // tslint:disable-line no-unused-variable
import {registerPlugin} from '../../ts/plugins';
import {LinksPlugin, linksPluginName} from '../links';
import {SpecialBlock} from '../../share/components/Block/BlockWithTypeHeader';
import {ShareAltOutlined} from '@ant-design/icons';
import {copyToClipboard} from '../../components';
import {Select} from 'antd';
import {MonacoEditorWrapper} from './MonacoEditorWrapper';

const languages = ['plaintext', 'c', 'java', 'scala', 'shell', 'python', 'json', 'sql',
  'xml', 'yaml', 'go', 'php', 'typescript', 'javascript'];
registerPlugin(
  {
    name: 'CodeSnippet',
    author: 'Jeff Wu',
    description: 'Lets you inline markdown content',
    dependencies: [linksPluginName],
  },
  function(api) {
    const linksPlugin = api.getPlugin(linksPluginName) as LinksPlugin;
    api.registerHook('session', 'renderAfterLine', (elements, {path, pluginData}) => {
      if (pluginData.links?.code) {
        elements.push(
          <SpecialBlock key={'code-block'}
                        specialClass={'effect-code-block'}
                        path={path}
                        collapse={pluginData.links.collapse || false}
                        setCollapseCallback={(collapse) => linksPlugin.setBlockCollapse(path.row, collapse)}
                        blockType={
                          <Select
                            showSearch
                            style={{ width: 100 }}
                            bordered={false}
                            value={pluginData.links.code.language}
                            onChange={(value: string) => {
                              linksPlugin.getCode(path.row).then((code) => {
                                linksPlugin.setCode(path.row, code.content, value).then(() => {
                                  api.session.emit('updateInner');
                                });
                              });
                            }}
                            options={languages.map(l => {return {value: l, label: l}; } )}
                          />
                        }
                        session={api.session}
                        onCopy={() => {
                              copyToClipboard(pluginData.links.code.content);
                        }}
          >
            <MonacoEditorWrapper
              session={api.session}
              path={path}
              pluginData={pluginData}
              theme={api.session.clientStore.getClientSetting('curTheme').includes('Dark') ? 'vs-dark' : 'vs-light'}
              lockEdit={api.session.lockEdit}
              onChange={(newValue) => {
                linksPlugin.setCode(path.row, newValue, pluginData.links.code.language);
              }}/>
          </SpecialBlock>
        );
      }
      return elements;
    });
  },
  (api => api.deregisterAll()),
);

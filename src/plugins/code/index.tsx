import * as React from 'react'; // tslint:disable-line no-unused-variable
import {registerPlugin} from '../../ts/plugins';
import {LinksPlugin, linksPluginName} from '../links';
import MonacoEditor from 'react-monaco-editor';
import {SpecialBlock} from '../../share/components/Block/BlockWithTypeHeader';
import {ShareAltOutlined} from '@ant-design/icons';
import {copyToClipboard} from '../../components';
import {Space, Select} from 'antd';

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
        const lines = pluginData.links.code.content.split('\n').length;
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
                        tools={
                            <ShareAltOutlined onClick={() => {
                              copyToClipboard(pluginData.links.code.content);
                              api.session.showMessage('已复制');
                            }} />
                        }
          >
            <MonacoEditor
              width='100%'
              height={Math.min(Math.max(lines * 20, 20), 400)}
              key='code'
              language={pluginData.links.code.language}
              theme={api.session.clientStore.getClientSetting('curTheme').includes('Dark') ? 'vs-dark' : 'vs-light'}
              value={pluginData.links.code.content || ''}
              options={{lineHeight: 20, lineNumbersMinChars: 5, scrollBeyondLastLine: false,
                readOnly: api.session.lockEdit}}
              onChange={(newValue) => {
                linksPlugin.setCode(path.row, newValue, pluginData.links.code.language);
              }}
            />
          </SpecialBlock>
        );
      }
      return elements;
    });
  },
  (api => api.deregisterAll()),
);

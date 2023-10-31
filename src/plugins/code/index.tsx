import * as React from 'react'; // tslint:disable-line no-unused-variable
import {registerPlugin} from '../../ts/plugins';
import {LinksPlugin, linksPluginName} from '../links';
import {SpecialBlock} from '../../share/components/Block/BlockWithTypeHeader';
import {ShareAltOutlined} from '@ant-design/icons';
import {copyToClipboard} from '../../components';
import {Select, Space, Tooltip} from 'antd';
import {MonacoEditorWrapper} from './MonacoEditorWrapper';
import {EmitFn, PartialUnfolder, Token, Tokenizer} from '../../share';

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
    api.registerHook('session', 'renderAfterLine', (elements, {path, pluginData, line}) => {
      if (pluginData.links?.code) {
        const wrap = pluginData.links?.code.wrap;
        elements.push(
          <SpecialBlock key={'code-block'}
                        specialClass={'effect-code-block'}
                        path={path}
                        collapse={pluginData.links.collapse || false}
                        setCollapseCallback={(collapse) => linksPlugin.setBlockCollapse(path.row, collapse)}
                        blockType={
                          <Select
                            showSearch
                            style={{width: 100}}
                            bordered={false}
                            value={pluginData.links.code.language}
                            onChange={(value: string) => {
                              linksPlugin.getCode(path.row).then((code) => {
                                linksPlugin.setCode(path.row, code.content, value, code.wrap).then(() => {
                                  api.session.emit('updateInner');
                                });
                              });
                            }}
                            options={languages.map(l => {
                              return {value: l, label: l};
                            })}
                          />
                        }
                        tools={
                          <Space>
                            <Tooltip title={wrap ? '当前展示方式：自动换行' : '当前展示方式：内容溢出'}>
                              <img style={{position: 'relative', top: '2px'}}
                                   onClick={() => {
                                     linksPlugin.getCode(path.row).then((code) => {
                                       linksPlugin.setCode(path.row, code.content, code.language, !code.wrap).then(() => {
                                         api.session.emit('updateInner');
                                       });
                                     });
                                   }}
                                   src={`${process.env.PUBLIC_URL}/images/${wrap ? 'wrap' : 'nowrap'}.png`}
                                   height={api.session.clientStore.getClientSetting('fontSize') + 2}/>
                            </Tooltip>
                          </Space>
                        }
                        session={api.session}
                        onCopy={() => {
                          copyToClipboard(pluginData.links.code.content);
                        }}
          >
            <MonacoEditorWrapper
              session={api.session}
              title={line.join('')}
              path={path}
              pluginData={pluginData}
              theme={api.session.clientStore.getClientSetting('curTheme').includes('Dark') ? 'vs-dark' : 'vs-light'}
              lockEdit={api.session.lockEdit}
              onChange={(newValue) => {
                linksPlugin.setCode(path.row, newValue, pluginData.links.code.language, pluginData.links.code.wrap);
              }}/>
          </SpecialBlock>
        );
      }
      return elements;
    });
    api.registerHook('session', 'renderLineTokenHook', (tokenizer, {pluginData}) => {
        if (pluginData.links?.code) {
          return tokenizer.then(new PartialUnfolder<Token, React.ReactNode>((
            _token: Token, _emit: EmitFn<React.ReactNode>, _wrapped: Tokenizer
          ) => {
            // do nothing
          }));
        } else {
          return tokenizer;
        }
    });
  },
  (api => api.deregisterAll()),
);

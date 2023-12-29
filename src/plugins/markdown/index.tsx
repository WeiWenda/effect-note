import * as React from 'react'; // tslint:disable-line no-unused-variable
import {registerPlugin} from '../../ts/plugins';
import {LinksPlugin, linksPluginName} from '../links';
import Vditor from 'vditor';
import {EditOutlined} from '@ant-design/icons';
import $ from 'jquery';
import {SpecialBlock} from '../../share/components/Block/SpecialBlock';
import {copyToClipboard} from '../../components';

registerPlugin(
  {
    name: 'Markdown',
    author: 'Jeff Wu',
    description: 'Lets you inline markdown content',
    dependencies: [linksPluginName],
  },
  function(api) {
    const linksPlugin = api.getPlugin(linksPluginName) as LinksPlugin;
    api.registerHook('session', 'renderAfterLine', (elements, {path, line, pluginData}) => {
      if (pluginData.links?.md) {
        const id = `vditor-${path.row}`;
        const vditorDiv = (
          <SpecialBlock key={'special-block'}
                        path={path}
                        title={line.join('')}
                        collapse={pluginData.links.collapse || false}
                        onCopy={() => {
                          copyToClipboard(pluginData.links.md);
                        }}
                        blockType={'Markdown'} tools={
            <EditOutlined onClick={() => {
              api.session.mdEditorOnSave = (markdown: string, _html: string) => {
                linksPlugin.setMarkdown(path.row, markdown).then(() => {
                  api.session.emit('updateAnyway');
                });
              };
              api.session.emit('openModal', 'md', {'md': pluginData.links.md});
            }}/>
          } session={api.session}>
            <div id={id} className={'node-markdown'} key={id}/>
          </SpecialBlock>
        );
        setTimeout(() => {
          const divs = $(`#${id}`).get();
          const mode = api.session.clientStore.getClientSetting('curTheme').includes('Dark') ? 'dark' : 'light';
          if (divs.length > 0) {
            Vditor.preview(divs[0] as HTMLDivElement, pluginData.links.md, {mode,
              hljs: {
                lineNumber: true
              },
              cdn: 'http://localhost:51223/vditor',
              transform: (html: string) => {
                return html.replace('<a ', '<a target="_blank" ');
              },
              theme : {
                current: mode,
                path: 'content-theme'
              }});
          }
        }, 100);
        elements.push(vditorDiv);
      }
      return elements;
    });
  },
  (api => api.deregisterAll()),
);

import * as React from 'react'; // tslint:disable-line no-unused-variable

import { Token, RegexTokenizerSplitter, EmitFn, Tokenizer } from '../../share';
import { registerPlugin } from '../../ts/plugins';
import Highlight from 'react-highlight';
import {EditOutlined} from '@ant-design/icons';
import {SpecialBlock} from '../../share/components/Block/BlockWithTypeHeader';
import {htmlRegex, htmlTypes} from '../../ts/util';
import {FontStyleToolComponent} from '../../share/components/Line/fontStyleTool';
import {LinksPlugin, linksPluginName} from '../links';

registerPlugin(
  {
    name: 'HTML',
    author: 'Jeff Wu',
    description: `
      Lets you inline the following html tags:
        ${ htmlTypes.map((htmltype) => '<' + htmltype + '>').join(' ') }
    `,
    dependencies: [linksPluginName],
  },
  function(api) {
    const linksPlugin = api.getPlugin(linksPluginName) as LinksPlugin;
    api.registerHook('session', 'renderLineTokenHook', (tokenizer, info) => {
      // if (info.has_cursor && !info.lockEdit) {
      //   return tokenizer;
      // }
      // if (info.has_highlight && !info.lockEdit) {
      //   return tokenizer;
      // }
      return tokenizer.then(RegexTokenizerSplitter(
        new RegExp(htmlRegex),
        (token: Token, emit: EmitFn<React.ReactNode>, wrapped: Tokenizer) => {
          try {
            const htmlContent = token.text;
            if (htmlContent.startsWith('<div class=\'node-html\'>')) {
              emit(
                <SpecialBlock key={`html-${token.index}`}
                              path={info.path}
                              collapse={info.pluginData.links?.collapse || false}
                              setCollapseCallback={(collapse) => linksPlugin.setBlockCollapse(info.path.row, collapse)}
                              blockType={'RTF'} session={api.session} tools={
                  <EditOutlined onClick={() => {
                    const path = info.path;
                    api.session.wangEditorOnSave = (html: any) => {
                      let wrappedHtml = html;
                      wrappedHtml = `<div class='node-html'>${html}</div>`;
                      api.session.changeChars(path.row, 0, htmlContent.length, (_ ) => wrappedHtml.split('')).then(() => {
                        api.session.emit('updateAnyway');
                      });
                    };
                    api.session.emit('openModal', 'rtf', {html: htmlContent.slice('<div class=\'node-html\'>'.length, -6)});
                  }}/>
                }>
                  <Highlight innerHTML={true}>
                    {token.text}
                  </Highlight>
                </SpecialBlock>
              );
            } else {
              const textContent = new RegExp(htmlRegex).exec(token.text);
              if (textContent && textContent[4] && !api.session.lockEdit) {
                emit(
                  <FontStyleToolComponent key={`html-${token.index}`}
                                          session={api.session} path={info.path}
                                          textContent={textContent[4]}
                                          showDelete={true}
                                          startCol={token.index} endCol={token.index + token.length}
                                          trigger={'click'}>
                    <span
                      dangerouslySetInnerHTML={{__html: token.text}}
                    />
                  </FontStyleToolComponent>
                );
              } else if (textContent && textContent[9] && !api.session.lockEdit) {
                emit(
                  <FontStyleToolComponent key={`html-${token.index}`}
                                          session={api.session} path={info.path}
                                          textContent={textContent[10]}
                                          link={textContent[9]}
                                          showDelete={true}
                                          startCol={token.index} endCol={token.index + token.length}>
                    <span
                      dangerouslySetInnerHTML={{__html: token.text}}
                    />
                  </FontStyleToolComponent>
                );
              } else {
                emit(<span
                  key={`html-${token.index}`}
                  className={'node-html'}
                  dangerouslySetInnerHTML={{__html: token.text}}
                />);
              }
            }
          } catch (e: any) {
            api.session.showMessage(e.message, { text_class: 'error' });
            emit(...wrapped.unfold(token));
          }
        }
      ));
    });
  },
  (api => api.deregisterAll()),
);

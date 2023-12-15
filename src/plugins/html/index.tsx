import * as React from 'react'; // tslint:disable-line no-unused-variable

import {Token, RegexTokenizerSplitter, EmitFn, Tokenizer, Session} from '../../share';
import { registerPlugin } from '../../ts/plugins';
import Highlight from 'react-highlight';
import {EditOutlined} from '@ant-design/icons';
import {SpecialBlock} from '../../share/components/Block/SpecialBlock';
import {htmlRegex, htmlTypes} from '../../ts/util';
import {FontStyleToolComponent} from '../../share/components/Line/fontStyleTool';
import {LinksPlugin, linksPluginName} from '../links';
import {copyToClipboard} from '../../components';

export function htmlHook(tokenizer: any, info: any) {
  // if (info.has_cursor && !info.lockEdit) {
  //   return tokenizer;
  // }
  // if (info.has_highlight && !info.lockEdit) {
  //   return tokenizer;
  // }
  const session: Session = info.session;
  return tokenizer.then(RegexTokenizerSplitter(
    new RegExp(htmlRegex),
    (token: Token, emit: EmitFn<React.ReactNode>, wrapped: Tokenizer) => {
      try {
        const textContent = new RegExp(htmlRegex).exec(token.text);
        if (textContent && textContent[4] && !info.editDisable) {
          emit(
            <FontStyleToolComponent key={`html-${token.index}`}
                                    session={session} path={info.path}
                                    textContent={textContent[4]}
                                    allClasses={textContent[3].split(' ')}
                                    showDelete={true}
                                    startCol={token.index} endCol={token.index + token.length}
                                    trigger={['click', 'contextMenu']}>
                  <span
                    dangerouslySetInnerHTML={{__html: token.text}}
                  />
            </FontStyleToolComponent>
          );
        } else if (textContent && textContent[9] && !info.editDisable) {
          emit(
            <FontStyleToolComponent key={`html-${token.index}`}
                                    session={session} path={info.path}
                                    textContent={textContent[10]}
                                    link={textContent[9]}
                                    allClasses={[]}
                                    trigger={'contextMenu'}
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
      } catch (e: any) {
        session.showMessage(e.message, { text_class: 'error' });
        emit(...wrapped.unfold(token));
      }
    }
  ));
};

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
    api.registerHook('session', 'renderLineTokenHook', htmlHook);
    api.registerHook('session', 'renderAfterLine', (elements, {path, pluginData, line, session}) => {
      if (pluginData.links?.rtf) {
        const htmlContent = pluginData.links?.rtf;
        elements.push(
          <SpecialBlock key={`html-${path.row}`}
                        path={path}
                        title={line.join('')}
                        collapse={pluginData.links?.collapse || false}
                        onCopy={() => {
                          copyToClipboard(htmlContent);
                        }}
                        blockType={'RTF'} session={api.session} tools={
            <EditOutlined onClick={() => {
              session.wangEditorOnSave = (content: any) => {
                const wrappedHtml = `<div class='node-html'>${content}</div>`;
                session.emitAsync('setRTF', path.row, wrappedHtml).then(() => {
                  session.emit('updateInner');
                });
              };
              session.emit('openModal', 'rtf', {html: htmlContent.slice('<div class=\'node-html\'>'.length, -6)});
            }}/>
          }>
            <Highlight innerHTML={true}>
              {htmlContent}
            </Highlight>
          </SpecialBlock>
        );
      }
      return elements;
    });
  },
  (api => api.deregisterAll()),
);

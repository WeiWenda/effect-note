import * as React from 'react'; // tslint:disable-line no-unused-variable

import { Token, RegexTokenizerSplitter, EmitFn, Tokenizer } from '../../share';
import { registerPlugin } from '../../ts/plugins';
import Highlight from 'react-highlight';
import {EditOutlined} from '@ant-design/icons';
import {SpecialBlock} from '../../share/components/Block/BlockWithTypeHeader';
import {htmlRegex, htmlTypes} from '../../ts/util';

registerPlugin(
  {
    name: 'HTML',
    author: 'Jeff Wu',
    description: `
      Lets you inline the following html tags:
        ${ htmlTypes.map((htmltype) => '<' + htmltype + '>').join(' ') }
    `,
  },
  function(api) {
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
            emit(
              <SpecialBlock key={`html-${token.index}`} blockType={'RTF'} session={api.session} tools={
                <EditOutlined onClick={() => {
                  const path = info.path;
                  const htmlContent = token.text;
                  setTimeout(() => {
                    if (htmlContent.startsWith('<div class=\'node-html\'>')) {
                      api.session.wangEditorHtml = htmlContent.slice('<div class=\'node-html\'>'.length, -6);
                    } else {
                      api.session.wangEditorHtml = htmlContent;
                    }
                    api.session.emit('updateAnyway');
                  }, 100);
                  api.session.wangEditorModalVisible = true;
                  api.session.wangEditorOnSave = (html: any) => {
                    let wrappedHtml = html;
                    wrappedHtml = `<div class='node-html'>${html}</div>`;
                    api.session.changeChars(path.row, 0, htmlContent.length, (_ ) => wrappedHtml.split('')).then(() => {
                      api.session.emit('updateAnyway');
                    });
                  };
                  api.session.emit('updateAnyway');
                }}/>
              }>
                <Highlight innerHTML={true}>
                  {token.text}
                </Highlight>
              </SpecialBlock>
            );
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

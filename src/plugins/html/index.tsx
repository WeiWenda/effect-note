import * as React from 'react'; // tslint:disable-line no-unused-variable

import { Token, RegexTokenizerSplitter, EmitFn, Tokenizer } from '../../share';
import { registerPlugin } from '../../ts/plugins';
import Highlight from 'react-highlight';
import {LinksPlugin, linksPluginName} from '../links';

const htmlTypes: Array<string> = [
  'div',
  'span',
  'img',
  'table'
];

const htmlRegexParts: Array<string> = [];
htmlTypes.forEach((htmltype) => {
  htmlRegexParts.push(
    `<${htmltype}(.|\\n)*>(.|\\n)*</${htmltype}>`
  );
  // self-closing
  htmlRegexParts.push(
    `<${htmltype}(.|\\n)*/>`
  );
});
export const htmlRegex = '(' + htmlRegexParts.map((part) => '(' + part + ')').join('|') + ')';

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
            emit(
                <div key={`html-${token.index}`} onClick={() => {
                    if (api.session.lockEdit) {
                        return;
                    }
                    const path = info.path;
                    if (info.pluginData.links.md) {
                      const md = info.pluginData.links.md;
                      api.session.md = md;
                      api.session.mdEditorModalVisible = true;
                      api.session.mdEditorOnSave = (markdown: string, html: string) => {
                        linksPlugin.setMarkdown(path.row, markdown).then(() => {
                          let wrappedHtml = html;
                          wrappedHtml = `<div class='node-html'>${html}</div>`;
                          api.session.changeChars(path.row, 0, info.line.length, (_ ) => wrappedHtml.split('')).then(() => {
                            api.session.emit('updateAnyway');
                          });
                        });
                      };
                    } else {
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
                    }
                    api.session.emit('updateAnyway');
                }}>
                  <Highlight innerHTML={true}>
                    {token.text}
                  </Highlight>
                </div>
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

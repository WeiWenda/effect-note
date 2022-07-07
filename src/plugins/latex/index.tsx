import * as React from 'react'; // tslint:disable-line no-unused-variable
import * as katex from 'katex';
import 'katex/dist/katex.min.css';

import { Tokenizer, Token, RegexTokenizerSplitter, EmitFn } from '../../share';
import { registerPlugin } from '../../ts/plugins';
import { matchWordRegex } from '../../ts/text';

registerPlugin(
  {
    name: 'LaTeX',
    author: 'Jeff Wu',
    description: `
      Lets you inline LaTeX between $ delimiters,
      or add block LaTeX between $$ delimiters.
      Limited to what KaTeX supports.
    `,
  },
  function(api) {
    api.registerHook('session', 'renderLineTokenHook', (tokenizer, info) => {
      if (info.has_cursor && !info.lockEdit) {
        return tokenizer;
      }
      if (info.has_highlight && !info.lockEdit) {
        return tokenizer;
      }
      return tokenizer.then(RegexTokenizerSplitter(
        matchWordRegex('\\$\\$(\\n|.)+?\\$\\$'),
        (token: Token, emit: EmitFn<React.ReactNode>, wrapped: Tokenizer) => {
          try {
            const html = katex.renderToString(token.text.slice(2, -2), { displayMode: true });
            emit(<div key={`latex-${token.index}`} dangerouslySetInnerHTML={{__html: html}}/>);
          } catch (e: any) {
            api.session.showMessage(e.message, { text_class: 'error' });
            emit(...wrapped.unfold(token));
          }
        }
      )).then(RegexTokenizerSplitter(
        matchWordRegex('\\$(\\n|.)+?\\$'),
        (token: Token, emit: EmitFn<React.ReactNode>, wrapped: Tokenizer) => {
          try {
            const html = katex.renderToString(token.text.slice(1, -1), { displayMode: false });
            emit(<span key={`latex-${token.index}`} dangerouslySetInnerHTML={{__html: html}}/>);
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

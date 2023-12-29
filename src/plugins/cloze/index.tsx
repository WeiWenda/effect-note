import {PluginApi, registerPlugin} from '../../ts/plugins';
import {Logger} from '../../ts/logger';
import {Col, Document, EmitFn, PartialUnfolder, Row, Session, SplitToken, Token, Tokenizer} from '../../share';
import React from 'react';
import {ClozeBox} from './ClozeBox';
import {ContentEditableWrapper} from '../../share/components/Line/ContentEditableWrapper';
import {getStyles} from '../../share/ts/themes';
import $ from 'jquery';

export class ClozePlugin {
  private api: PluginApi;
  private logger: Logger;
  private session: Session;
  private document: Document;

  constructor(api: PluginApi) {
    this.api = api;
    this.logger = this.api.logger;
    this.session = this.api.session;
    this.document = this.session.document;
    // NOTE: this may not be initialized correctly at first
    // this only affects rendering @taglinks for now
  }

  public async enable() {
    this.api.registerListener('session', 'addCloze', async (row: Row, startCol: Col, answer: string) => {
      await this.setCloze(row, startCol, answer);
    });
    this.api.registerListener('session', 'removeCloze', async (row: Row, startCol: Col) => {
      await this.removeCloze(row, startCol);
    });
    this.api.registerHook('document', 'serializeRow', async (struct, info) => {
      const clozes = await this.getClozes(info.row);
      if (clozes) {
        struct.clozes = clozes;
      }
      return struct;
    });
    this.api.registerListener('document', 'loadRow', async (path, serialized) => {
      if (serialized.clozes != null) {
        Object.keys(serialized.clozes).forEach(async (key) => {
          const startCol = Number(key);
          await this._setCloze(path.row, startCol, serialized.clozes[key]);
        });
      }
    });
    this.api.registerHook('document', 'pluginRowContents', async (obj, { row }) => {
      const clozes = await this.getClozes(row);
      if (clozes) {
        obj.clozes = clozes;
      }
      return obj;
    });
    this.api.registerHook('session', 'renderLineContents', (lineContents, info) => {
      if (info.pluginData.clozes && !this.session.cursor.path.is(info.path) && info.line.length === 0) {
        lineContents.unshift(<ClozeBox key={`height-anchor-0`}
                                            session={this.session}
                                            row={info.path.row}
                                            startCol={0}
                                            cloze={info.pluginData.clozes[0]}/>);
       }
      return lineContents;
    });
    this.api.registerHook('session', 'renderLineTokenHook', (tokenizer, info) => {
      if (info.pluginData.clozes) {
        return tokenizer.then(new PartialUnfolder<Token, React.ReactNode>((
          token: Token, emit: EmitFn<React.ReactNode>, wrapped: Tokenizer
        ) => {
          const clozes = Object.keys(info.pluginData.clozes).map(x => Number(x)).sort((n1, n2) => n1 - n2);
          let endCol = 0;
          while (clozes.length > 0) {
            const startCol = clozes.shift()!;
            let filler_token;
            if (startCol > 0) {
              [filler_token, token] = SplitToken(token, startCol - endCol);
              emit(...wrapped.unfold(filler_token));
            }
            endCol = startCol;
            if (token.info.length > 0 && token.info[0].cursor) {
              setTimeout(() => {
                if (!this.session.stopMonitor && this.session.hoverRow && info.path.is(session.hoverRow)) {
                  $('#input-hack').focus();
                }
              }, 50);
              emit(
                <ContentEditableWrapper key={token.index + endCol}
                                        session={this.session}
                                        cursorStyle={getStyles(this.session.clientStore, ['theme-cursor'])}/>
              );
              token.info[0].cursor = false;
            }
            emit(<ClozeBox key={`height-anchor-${startCol}`}
                               session={this.session}
                               row={info.path.row}
                               startCol={startCol}
                               cloze={info.pluginData.clozes[startCol]}/>);
          }
          emit(...wrapped.unfold(token));
        }));
      } else {
        return tokenizer;
      }
    });
  }

  public async setCloze(row: Row, startCol: Col, answer: string): Promise<void> {
    await this._setCloze(row, startCol, {answer: answer, show: false});
    await this.api.updatedDataForRender(row);
  }

  public async removeCloze(row: Row, startCol: Col): Promise<void> {
    const ids_to_clozes = await this.api.getData('ids_to_clozes', {});
    const before: number[] = JSON.parse(ids_to_clozes[row] || '[]') as number[];
    const after: number[] = before.filter(x => x !== startCol);
    if (after.length > 0) {
      ids_to_clozes[row] = JSON.stringify(after);
    } else {
      delete ids_to_clozes[row];
    }
    await this.api.setData('ids_to_clozes', ids_to_clozes);
    await this.api.updatedDataForRender(row);
  }

  private async _setCloze(row: Row, startCol: Col, comment: any): Promise<void> {
    await this.api.setData(`${row}:${startCol}:cloze`, comment);
    // 不存在的key查询效率较差
    const ids_to_clozes = await this.api.getData('ids_to_clozes', {});
    const before: number[] = JSON.parse(ids_to_clozes[row] || '[]') as number[];
    before.push(startCol);
    ids_to_clozes[row] = JSON.stringify(before.sort((n1, n2) => n1 - n2));
    await this.api.setData('ids_to_clozes', ids_to_clozes);
  }

  public async getClozes(row: Row): Promise<any> {
    const ids_to_clozes = await this.api.getData('ids_to_clozes', {});
    if (ids_to_clozes[row]) {
      const cols: number[] = JSON.parse(ids_to_clozes[row] || '[]') as number[];
      const clozes: { [key: number]: any; } = {};
      while (cols.length > 0) {
        const startCol = cols.shift();
        clozes[startCol] =  await this.api.getData(`${row}:${startCol}:cloze`, {});
      }
      return clozes;
    } else {
      return null;
    }
  }
}


export const pluginName = 'Cloze';

registerPlugin<ClozePlugin>(
  {
    name: pluginName,
    author: 'Victor Tao',
    description:
      `Similar to Marks, but each row can have multiple tags and tags can be reused.
      Press '#' to add a new tag, 'd#[number]' to remove a tag, and '-' to search tags.
   `,
    version: 1,
  },
  async (api) => {
    const tagsPlugin = new ClozePlugin(api);
    await tagsPlugin.enable();
    return tagsPlugin;
  },
  (api) => api.deregisterAll(),
);

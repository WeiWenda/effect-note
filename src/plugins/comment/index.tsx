import {PluginApi, registerPlugin} from '../../ts/plugins';
import {Logger} from '../../ts/logger';
import {Col, Document, EmitFn, PartialUnfolder, Row, Session, SplitToken, Token, Tokenizer} from '../../share';
import {HeightAnchor} from './HeightAnchor';
import {CommentBox} from './CommentBox';
import Moment from 'moment';

export class CommentPlugin {
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
    const that = this;
    this.api.registerListener('session', 'addComment', async (row: Row, startCol: Col, endCol: Col, comment: string) => {
      await this.setComments(row, startCol, endCol, comment);
      that.session.emit('changeComment');
    });
    this.api.registerListener('session', 'removeComment', async (row: Row, startCol: Col, endCol: Col) => {
      await this.removeComments(row, startCol, endCol);
      that.session.emit('changeComment');
    });
    this.api.registerListener('session', 'resolveComment', async (row: Row, startCol: Col, endCol: Col) => {
      await this.resolveComments(row, startCol, endCol);
      that.session.emit('changeComment');
    });
    this.api.registerHook('document', 'serializeRow', async (struct, info) => {
      const comment = await this.getComments(info.row);
      if (comment) {
        struct.comment = comment;
      }
      return struct;
    });
    this.api.registerListener('document', 'loadRow', async (path, serialized) => {
      if (serialized.comment != null) {
        Object.keys(serialized.comment).forEach(async (key) => {
          const startCol = Number(key.split('-').shift());
          const endCol = Number(key.split('-').pop());
          await this._setComments(path.row, startCol, endCol, serialized.comment[key]);
        });
      }
    });
    this.api.registerHook('document', 'pluginRowContents', async (obj, { row }) => {
      const comments = await this.getComments(row);
      if (comments) {
        obj.comments = Object.keys(comments).flatMap(r => r.split('-')).map(i => Number(i))
          .sort((n1, n2) => n1 - n2);
      } else {
        obj.comments = [];
      }
      return obj;
    });
    this.api.registerHook('session', 'renderLineTokenHook', (tokenizer, info) => {
      if (info.pluginData.comments && info.pluginData.comments.length > 0) {
        const comments = [...info.pluginData.comments];
        return tokenizer.then(new PartialUnfolder<Token, React.ReactNode>((
          token: Token, emit: EmitFn<React.ReactNode>, wrapped: Tokenizer
        ) => {
          let endCol = 0;
          while (comments.length > 0) {
            const startCol = comments.shift()!;
            let filler_token;
            [filler_token, token] = SplitToken(token, startCol - endCol);
            endCol = comments.shift()!;
            emit(...wrapped.unfold(filler_token));
            [filler_token, token] = SplitToken(token, endCol - startCol);
            emit(<HeightAnchor key={`height-anchor-${startCol}`}
                               session={this.session}
                               row={info.path.row}
                               startCol={startCol}
                               text={filler_token.text}/>);
          }
          emit(...wrapped.unfold(token));
        }));
      } else {
        return tokenizer;
      }
    });
    this.api.registerHook('session', 'renderComments', async (comments, session) => {
      const ids_to_comments = await this.api.getData('ids_to_comments', {});
      await Promise.all(Object.keys(ids_to_comments).map(async (key)  => {
        const row = Number(key);
        const curComments = await this.getComments(row);
        Object.keys(curComments).forEach((colPair) => {
          const commentId = `${row}-${colPair.split('-').shift()}`;
          const commentRef = session.commentRef[commentId];
          if (commentRef && commentRef.current != null) {
            const height = commentRef.current.offsetTop;
            comments.push(
              <div key={`comment-${row}-${colPair}`} className={'comment-wrapper'} style={{position: 'absolute', top: height}}>
                <CommentBox
                  startCol={Number(colPair.split('-').shift())}
                  endCol={Number(colPair.split('-').pop())}
                  row={row}
                  session={session}
                  content={curComments[colPair].content}
                  resolved={curComments[colPair].resolve}
                  createTime={curComments[colPair].createTime}
                />
              </div>);
          }
        });
      }));
      return comments;
    });
  }

  public async setComments(row: Row, startCol: Col, endCol: Col, comment: string): Promise<void> {
    await this._setComments(row, startCol, endCol, {content: comment, resolve: false, createTime: Moment().format('yyyy-MM-DD HH:mm:ss')});
    await this.api.updatedDataForRender(row);
  }

  public async removeComments(row: Row, startCol: Col, endCol: Col): Promise<void> {
    const ids_to_comments = await this.api.getData('ids_to_comments', {});
    const before: number[] = JSON.parse(ids_to_comments[row] || '[]') as number[];
    const after: number[] = [];
    while (before.length > 0) {
      const startCol1 = before.shift()!;
      const endCol1 = before.shift()!;
      if ((startCol1 >= startCol && startCol1 <= endCol) || (endCol1 >= startCol && endCol1 <= endCol)) {
        continue;
      } else {
        after.push(startCol1, endCol1);
      }
    }
    if (after.length > 0) {
      ids_to_comments[row] = JSON.stringify(after);
    } else {
      delete ids_to_comments[row];
    }
    await this.api.setData('ids_to_comments', ids_to_comments);
    await this.api.updatedDataForRender(row);
  }

  public async resolveComments(row: Row, startCol: Col, endCol: Col): Promise<void> {
    const oldComment = await this.api.getData(`${row}:${startCol}-${endCol}:comment`, {});
    await this._setComments(row, startCol, endCol, {...oldComment, resolve: true});
    await this.api.updatedDataForRender(row);
  }

  private async _setComments(row: Row, startCol: Col, endCol: Col, comment: any): Promise<void> {
    await this.api.setData(`${row}:${startCol}-${endCol}:comment`, comment);
    // 不存在的key查询效率较差
    const ids_to_comments = await this.api.getData('ids_to_comments', {});
    const before: number[] = JSON.parse(ids_to_comments[row] || '[]') as number[];
    const after: number[] = [startCol, endCol];
    while (before.length > 0) {
      const startCol1 = before.shift()!;
      const endCol1 = before.shift()!;
      if ((startCol1 >= startCol && startCol1 <= endCol) || (endCol1 >= startCol && endCol1 <= endCol)) {
        continue;
      } else {
        after.push(startCol1, endCol1);
      }
    }
    ids_to_comments[row] = JSON.stringify(after.sort((n1, n2) => n1 - n2));
    await this.api.setData('ids_to_comments', ids_to_comments);
  }

  public async getComments(row: Row): Promise<any> {
    const ids_to_comments = await this.api.getData('ids_to_comments', {});
    if (ids_to_comments[row]) {
      const cols: number[] = JSON.parse(ids_to_comments[row] || '[]') as number[];
      const comments: { [key: string]: any; } = {};
      while (cols.length > 0) {
        const startCol = cols.shift();
        const endCol = cols.shift();
        comments[`${startCol}-${endCol}`] =  await this.api.getData(`${row}:${startCol}-${endCol}:comment`, {});
      }
      return comments;
    } else {
      return null;
    }
  }
}


export const pluginName = 'Comment';

registerPlugin<CommentPlugin>(
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
    const tagsPlugin = new CommentPlugin(api);
    await tagsPlugin.enable();
    return tagsPlugin;
  },
  (api) => api.deregisterAll(),
);

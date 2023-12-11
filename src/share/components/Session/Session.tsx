import * as React from 'react';

import { promiseDebounce } from '../../ts/utils/functional';
import logger from '../../ts/utils/logger';

import * as Modes from '../../ts/modes';
import BlockComponent from '../Block/block';
import Spinner from '../Spinner';
import Session from '../../ts/session';
import { Col } from '../../ts/types';
import Path from '../../ts/path';
import { CursorsInfoTree } from '../../ts/cursor';

// TODO: move mode-specific logic into mode render functions

type Props = {
  session: Session;
  children?: React.ReactNode;
};
type State = {
  loaded: boolean;
  // set after data is loaded
  cursorsTree?: CursorsInfoTree;
};

type Profiler = (profilerMessage: string) => () => void;

export default class SessionComponent extends React.Component<Props, State> {
  private update: () => void; // this is promise debounced

  private profileRender: boolean; // for debugging
  private getProfiler: (profileRender: boolean) => Profiler;
  private onCharClick: (path: Path, column: number, e: MouseEvent) => void;
  private onLineClick: (path: Path) => Promise<void>;
  private onBulletClick: (path: Path) => Promise<void>;
  private onCrumbClick: (path: Path) => Promise<void>;

  constructor(props: Props) {
    super(props);
    this.state = {
      loaded: false
    };

    this.props.session.on('changeViewRoot', async (_path: Path) => {
      await this.update();
    });

    this.props.session.on('updateInner',  () => {
      logger.debug('updateInner');
      this.props.session.emit('changeComment');
      this.update();
    });

    // @ts-ignore
    this.onCharClick = (path, column, e) => {
      const session = this.props.session;
      switch (e.detail) {
        case 1:
          e.stopPropagation();
          break;
        case 2: {
          console.log('onCharDoubleClick');
          if (session.mode === 'INSERT') {
            session.selecting = true;
            if (session.selectInlinePath === null || !session.selectInlinePath.is(session.cursor.path)) {
              console.log(`selectWord selectInlinePath ${session.selectInlinePath} currentPath ${session.cursor.path}`);
              session.cursor.beginningWord().then(() => {
                session.setAnchor(session.cursor.path, session.cursor.col);
                session.cursor.endWord({cursor: {pastEndWord: true}}).then(() => {
                  session.selectInlinePath = session.cursor.path;
                  session.emit('updateInner');
                });
              });
            } else {
              console.log(`selectLine selectInlinePath ${session.selectInlinePath}`);
              session.cursor.home().then(() => {
                session.setAnchor(session.cursor.path, session.cursor.col);
                session.cursor.end({pastEnd: true}).then(() => {
                  session.selectInlinePath = null;
                  session.emit('updateInner');
                });
              });
            }
          }
          e.stopPropagation();
          break;
        }
        default:
      }
      return;
    };

    this.onLineClick = async (path) => {
      const session = this.props.session;
      console.log('onLineClick');
      // 防止select不上
      if (!session.selecting) {
        // if clicking outside of text, but on the row,
        // move cursor to the end of the row
        let col = this.cursorBetween() ? -1 : -2;
        if (session.mode === 'INSERT') {
          session.stopAnchor();
        }
        await session.cursor.setPosition(path, col);
        this.update();
      }
    };

    this.onBulletClick = async (path) => {
      const session = this.props.session;

      await session.toggleBlockCollapsed(path.row);
      session.cursor.reset();
      session.save();
      this.update();
    };

    this.onCrumbClick = async (path) => {
      const session = this.props.session;

      await session.zoomInto(path);
      session.save();
      this.update();
    };

    this.fetchAndRerender = this.fetchAndRerender.bind(this);

    // make true to output time taken to get render contents
    this.profileRender = false;

    this.getProfiler = (profileRender) => {
      if (!profileRender) {
        return () => () => null;
      }

      return (profilerMessage) => {
        const t0 = Date.now();

        return () => {
          logger.info(profilerMessage, Date.now() - t0);
        };
      };
    };

    this.update = promiseDebounce(async () => {
      const session = this.props.session;
      const finishProfiling = this.getProfiler(this.profileRender)('Update took');

      const cursorsTree = new CursorsInfoTree(Path.rootRow());
      const cursor = session.cursor;
      const cursorNode = cursorsTree.getPath(cursor.path);
      cursorNode.markCursor(cursor.col);
      if (session.mode === 'INSERT') {
        if (session.selecting) {
          const anchor = session.getAnchor();
          if (anchor === null) {
            return;
          }
          if (cursor.path.is(anchor.path) && session.selectInlinePath !== null) {
            // 单行选中
            let anchorCol = anchor.col;
            if (anchorCol === -1) {
              const virtualCursor = cursor.clone();
              await virtualCursor.setCol(-1);
              anchorCol = virtualCursor.col;
            }
            console.log(`anchor : ${anchorCol} cursor ${cursor.col}`);
            let start = Math.min(cursor.col, anchorCol);
            const end = Math.max(cursor.col, anchorCol);
            let cols: Array<Col> = [];
            for (let j = start; j < end; j++) {
              cols.push(j);
            }
            cursorNode.markCols(cols);
          } else {
            const [parent, index1, index2] = await session.getVisualLineSelections();
            // 多行选中
            const children = await session.document.getChildRange(parent, index1, index2);
            children.forEach((child) => {
              cursorsTree.getPath(child).markVisual();
            });
          }
        }
      } else if (session.mode === 'VISUAL_LINE') {
        // mirrors logic of finishes_visual_line in keyHandler.js
        const [parent, index1, index2] = await session.getVisualLineSelections();
        const children = await session.document.getChildRange(parent, index1, index2);
        children.forEach((child) => {
          cursorsTree.getPath(child).markVisual();
        });
      } else if (session.mode === 'VISUAL') {
        const anchor = session.anchor;
        if (anchor.path && cursor.path.is(anchor.path)) {
          const start = Math.min(cursor.col, anchor.col);
          const end = Math.max(cursor.col, anchor.col);
          let cols: Array<Col> = [];
          for (let j = start; j <= end; j++) {
            cols.push(j);
          }
          cursorNode.markCols(cols);
        } else {
          logger.warn('Multiline not yet implemented');
        }
      }

      this.setState({
        cursorsTree,
        loaded: true,
      });
      finishProfiling();
    });
  }

  private async fetchAndRerender() {
    console.log('fetchAndRerender');
    const session = this.props.session;
    const finishProfiling = this.getProfiler(this.profileRender)('forceLoadTree took');

    await session.document.forceLoadTree(session.viewRoot.row, true);

    finishProfiling();
    this.update();
  }

  public componentWillReceiveProps() {
    this.update();
  }

  public componentDidMount() {
    this.update();
  }

  private cursorBetween() {
    const mode = this.props.session.mode;
    return Modes.getMode(mode).metadata.cursorBetween;
  }

  public render() {
    const session = this.props.session;
    if (!this.state.loaded) { return <Spinner/>; }

    const cursorsTree = this.state.cursorsTree;
    if (cursorsTree == null) {
      throw new Error('cursorsTree should have been loaded');
    }

    const mode = session.mode;
    const viewRoot = session.viewRoot;
    const cachedRow = session.document.cache.get(viewRoot.row);
    if (cachedRow === null) {
      this.fetchAndRerender();
      return <Spinner/>;
    }

    const cursorBetween = this.cursorBetween();

    let onLineClick: ((path: Path) => void) | undefined = undefined;
    let onCharClick: ((path: Path, column: number, e: MouseEvent) => void) | undefined = undefined;
    if (mode === 'NORMAL' ||
      mode === 'INSERT' ||
      mode === 'VISUAL' ||
      mode === 'VISUAL_LINE'
    ) {
      onCharClick = this.onCharClick;
      onLineClick = this.onLineClick;
    }

    let onCrumbClick: ((...args: any[]) => void) | undefined = undefined;
    if (mode === 'NORMAL' ||
      mode === 'INSERT') {
      onCrumbClick = this.onCrumbClick;
    }

    // TODO: have an extra breadcrumb indicator when not at viewRoot?
    return (
      <div className='session-content'
           onMouseLeave={() => {
             this.props.session.setHoverRow(null, 'mouse leave');
           }}
      >
        <BlockComponent
          iconNoTopLevel='fa-circle'
          iconDirFold='fa-circle'
          iconDirUnFold='fa-circle'
          session={session}
          cursorsTree={cursorsTree.getPath(viewRoot)}
          cached={session.document.cache.get(viewRoot.row)}
          filteredRows={session.search ? session.search.results.rows : undefined}
          path={viewRoot}
          cursorBetween={cursorBetween}
          topLevel={true}
          onCharClick={onCharClick}
          onLineClick={onLineClick}
          onBulletClick={this.onCrumbClick}
          onFoldClick={this.onBulletClick}
          fetchData={this.fetchAndRerender}
        />
      </div>
    );
  }
}


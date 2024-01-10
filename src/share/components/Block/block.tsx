import * as React from 'react';

import LineComponent, { LineProps } from '../Line';
import Spinner from '../Spinner';

import Session from '../../ts/session';
import { CachedRowInfo } from '../../ts/document';
import Path from '../../ts/path';
import { CursorsInfoTree } from '../../ts/cursor';
import { Col } from '../../ts/types';
import { PartialUnfolder, Token } from '../../ts/utils/token_unfolder';
import { getStyles } from '../../ts/themes';
import {htmlRegex} from '../../../ts/util';
import Draggable, {DraggableCore} from 'react-draggable';

type RowProps = {
  session: Session;
  path: Path;
  cached: CachedRowInfo;
  onCharClick: ((path: Path, column: Col, e: MouseEvent) => void) | undefined;
  onClick: ((path: Path, e: MouseEvent) => void) | undefined;
  style: React.CSSProperties;
  cursorsTree: CursorsInfoTree;
  cursorBetween: boolean;
  viewOnly?: boolean;
  parentBoardNode?: boolean;
  indexInParent?: number;
};
class RowComponent extends React.Component<RowProps, {showDragHint: boolean}> {
  private onClick: ((e: MouseEvent) => void) | undefined = undefined;
  private onCharClick: ((column: Col, e: MouseEvent) => void) | undefined = undefined;

  constructor(props: RowProps) {
    super(props);
    this.state = {
      showDragHint: false
    };
    this.init(props);
  }

  private init(props: RowProps) {
    if (props.onClick) {
      this.onClick = (e: MouseEvent) => {
        if (!props.onClick) {
          throw new Error('onClick disappeared');
        }
        if (props.cached.pluginData.links?.md || props.cached.pluginData.links?.xml ||
          props.cached.pluginData.links?.code || props.cached.pluginData.links?.dataloom ||
          props.cached.line.join('').startsWith('<div class=\'node-html\'>')) {
          return;
        } else {
          props.onClick(props.path, e);
        }
      };
    }

    if (props.onCharClick) {
      this.onCharClick = (column: Col, e: MouseEvent) => {
        if (!props.onCharClick) {
          throw new Error('onCharClick disappeared');
        }
        props.onCharClick(props.path, column, e);
      };
    }
  }

  public componentWillReceiveProps(props: RowProps) {
    this.init(props);
  }

  public render() {
    const session = this.props.session;
    const path = this.props.path;
    const lineData = this.props.cached.line;
    const cursorsTree = this.props.cursorsTree;

    const cursors: {[col: number]: boolean} = {};
    let has_cursor = false;
    const highlights: {[col: number]: boolean} = {};
    let has_highlight = false;

    if (cursorsTree.cursor != null) {
      cursors[cursorsTree.cursor] = true;
      has_cursor = true;
    }
    // TODO: Object.keys alternative that returns Array<number>?
    (Object.keys(cursorsTree.selected)).forEach((col: any) => {
      highlights[col] = true;
      has_highlight = true;
    });
    // TODO: React.ReactNode vs React.ReactElement<any>?
    const results: Array<React.ReactNode> = [];
    const accents: {[column: number]: boolean} = {};
    if (this.props.session.search?.results.accentMap.has(path.row)) {
      this.props.session.search?.results.accentMap.get(path.row)!.forEach((i) => {
        accents[i] = true;
      });
    }
    let lineoptions: LineProps = {
      lineData,
      cursors,
      cursorStyle: getStyles(session.clientStore, ['theme-cursor']),
      highlights,
      highlightStyle: getStyles(session.clientStore, ['theme-bg-highlight']),
      linksStyle: getStyles(session.clientStore, ['theme-link']),
      accentStyle: getStyles(session.clientStore, ['theme-text-accent']),
      cursorBetween: this.props.cursorBetween,
      accents: accents,
      session: session,
      path: path
    };

    const hooksInfo = {
      session: this.props.session,
      path, pluginData: this.props.cached.pluginData,
      has_cursor, has_highlight,
      parentBoard: this.props.parentBoardNode,
      indexInParent: this.props.indexInParent,
      editDisable: this.props.session.lockEdit || this.props.viewOnly,
      line: this.props.cached.line
    };

    lineoptions.lineHook = PartialUnfolder.trivial<Token, React.ReactNode>();
    lineoptions.lineHook = session.applyHook(
      'renderLineTokenHook', lineoptions.lineHook, hooksInfo
    );

    lineoptions.wordHook = PartialUnfolder.trivial<Token, React.ReactNode>();
    lineoptions.wordHook = session.applyHook(
      'renderWordTokenHook', lineoptions.wordHook, hooksInfo
    );

    lineoptions = session.applyHook('renderLineOptions', lineoptions, hooksInfo);
    let lineContents = [
      <LineComponent key='line'
        onCharClick={this.onCharClick}
        {...lineoptions}
      />,
    ];
    if (!this.props.viewOnly) {
      lineContents = session.applyHook('renderLineContents', lineContents, hooksInfo);
    }
    results.push(...lineContents);

    let infoChildren = [];
    if (!this.props.viewOnly) {
      infoChildren = session.applyHook('renderAfterLine', [], hooksInfo);
    }

    return (
      <div key='text' className='node-text'
           onClick={(e) => {
             if (this.onClick) {this.onClick(e); }
           }}
           onMouseEnter={() => {
             if (!this.props.session.keydown) {
               this.props.session.setHoverRow(path, 'mouse');
             }
             if (this.props.session.dragging) {
               this.setState({showDragHint: true});
             }
           }}
           onMouseLeave={() => {
             this.setState({showDragHint: false});
           }}
        onMouseDown={(e) => {
          if (e.detail === 1 && !this.props.session.selectPopoverOpen) {
            // 颜色面板在其他block上层
            console.log('onLineMouseDown');
            session.selecting = false;
            session.setAnchor(path, -1);
          }
        }}
        onMouseMove={(e) => {
          if (path && !session.dragging && e.buttons === 1 && session.getAnchor()) {
            console.log(`onLineMouseMove set selectInlinePath ${path}`);
            session.selecting = true;
            session.selectMousePressing = true;
            session.selectInlinePath = path;
            session.cursor.setPosition(path, -1).then(() => {
              session.emit('updateInner');
            });
          }
        }}
        onMouseUp={(e) => {
          session.selectMousePressing = false;
          session.emit('updateInner');
          e.stopPropagation();
        }}
        style={this.props.style}
      >
        {results}
        {infoChildren}
        {
          this.state.showDragHint &&
          <div className={'drag-hint'} style={{...getStyles(this.props.session.clientStore, ['theme-bg-tertiary'])}}/>
        }
      </div>
    );
  }
}

type BlockProps = {
  session: Session;
  path: Path;

  cached: CachedRowInfo | null;
  cursorsTree: CursorsInfoTree;
  cursorBetween: boolean;
  onCharClick: ((path: Path, column: Col, e: MouseEvent) => void) | undefined;
  onLineClick: ((path: Path, e: MouseEvent) => void) | undefined;
  onBulletClick: ((path: Path) => void) | undefined;
  onFoldClick: ((path: Path) => void) | undefined;
  topLevel: boolean;
  viewOnly?: boolean;
  parentBoardNode?: boolean;
  indexInParent?: number;
  nothingMessage?: string;
  iconTopLevel?: string;
  iconDirFold?: string;
  iconDirUnFold?: string;
  iconNoTopLevel?: string;
  fetchData: () => void;
  filteredRows?: Set<number>;
};
export default class BlockComponent extends React.Component<BlockProps, {}> {
  // constructor(props: BlockProps) {
  //   super(props);
  // }

  public shouldComponentUpdate(nextProps: BlockProps) {
    if (this.props.cursorsTree.hasSelection) {
      return true;
    }
    if (nextProps.cursorsTree.hasSelection) {
      return true;
    }
    if (nextProps.topLevel !== this.props.topLevel) {
      return true;
    }
    if (nextProps.cached !== this.props.cached) {
      return true;
    }
    if (nextProps.parentBoardNode !== this.props.parentBoardNode) {
      return true;
    }
    if (nextProps.indexInParent !== this.props.indexInParent) {
      return true;
    }
    if (!nextProps.path.is(this.props.path)) {
      // NOTE: this can happen e.g. when you zoom out
      return true;
    }
    if (nextProps.cursorBetween !== this.props.cursorBetween) {
      return true;
    }
    if (nextProps.onCharClick !== this.props.onCharClick) {
      return true;
    }
    if (nextProps.onLineClick !== this.props.onLineClick) {
      return true;
    }
    if (nextProps.onBulletClick !== this.props.onBulletClick) {
      return true;
    }
    if (nextProps.filteredRows !== this.props.filteredRows) {
      return true;
    }
    if (nextProps.session.lastHoverRow?.getAncestry().includes(nextProps.path.row) ||
      nextProps.session.hoverRow?.getAncestry().includes(nextProps.path.row)) {
      return true;
    }
    // NOTE: it's assumed that session and fetchData never change

    return false;
  }


  public render() {
    const session = this.props.session;
    const parent = this.props.path;
    const cached = this.props.cached;
    const cursorsTree = this.props.cursorsTree;

    const pathElements: Array<React.ReactNode> = [];

    if (cached === null) {
      this.props.fetchData();
      return <Spinner/>;
    }

    if (!parent.isRoot()) {
      const rowStyle = {};
      if (this.props.topLevel) {
        Object.assign(rowStyle, {
          fontSize: 20,
          marginBottom: 10
        });
      }
      if (cached.pluginData.links?.is_callout) {
        Object.assign(rowStyle, {
          paddingTop: '10px',
          paddingBottom: '10px',
          borderBottomRightRadius: '6px',
          borderTopRightRadius: '6px',
          borderLeft: `solid 8px ${session.clientStore.getClientSetting('theme-bg-primary')}`,
          marginRight: '1em',
          background: ` linear-gradient(to right,
            ${session.clientStore.getClientSetting('theme-bg-primary')} 150px, transparent 100px)
            ,linear-gradient(to right, 
            ${session.clientStore.getClientSetting('theme-bg-callout')} 155px,
            ${session.clientStore.getClientSetting('theme-bg-callout')}50 100px)`
        });
      }
      const elLine = (
        <RowComponent key='row'
          style={rowStyle}
          cursorsTree={cursorsTree}
          cursorBetween={this.props.cursorBetween}
          session={session} path={parent}
          onCharClick={this.props.onCharClick}
          cached={cached}
          parentBoardNode={this.props.parentBoardNode}
          indexInParent={this.props.indexInParent}
          viewOnly={this.props.viewOnly}
          onClick={this.props.onLineClick}
        />
      );
      pathElements.push(elLine);
    }

    const children = cached.childRows;
    const collapsed = cached.collapsed;

    if (this.props.topLevel && !children.length) {
      let message = 'Nothing here yet.';
      if (session.mode === 'NORMAL') {
        // TODO move this
        message += ' Press `o` to start adding content!';
      }
      if (this.props.nothingMessage) {
        message = this.props.nothingMessage;
      }
      pathElements.push(
        <div key='nothing' className='center'
             style={{padding: 20, fontSize: 20, opacity: 0.5}}>
          { message }
        </div>
      );
    } else if (children.length && ((!collapsed) || this.props.topLevel)) {
      let childrenLoaded = true;
      let childrenDivs = cached.children.map((cachedChild, index) => {
        if (!this.props.filteredRows ||
          this.props.session.search?.results.accentMap.has(parent.row) ||
          this.props.filteredRows.has(cachedChild?.row!)) {
        if (cachedChild === null) {
         childrenLoaded = false;
         return null;
        }

        const row = cachedChild.row;
        const rowInfo = cachedChild.info;
        const path = parent.child(row);

        // let cloneIcon: React.ReactNode | null = null;
        let hoverIcon: React.ReactNode | null = null;
        const hoverStyle: React.CSSProperties = {};
        let foldIcon: React.ReactNode | null = null;
        if (!this.props.viewOnly && this.props.session.hoverRow?.row === row && cachedChild.childRows.length) {
          hoverStyle.marginLeft = -50;
          if (cachedChild.collapsed) {
            foldIcon = <i key='collapse'
                          onClick={() => this.props.onFoldClick!(path)}
                          className='fa fa-caret-right bullet fold-icon' />;
          } else {
            foldIcon = <i key='collapse'
                          onClick={() => this.props.onFoldClick!(path)}
                          className='fa fa-caret-down bullet fold-icon' />;
          }
        } else {
          hoverStyle.marginLeft = -50 + 25 / 2;
        }
        if (!this.props.viewOnly && this.props.session.hoverRow?.row === row) {
          hoverIcon = (
            <i key='hover' style={hoverStyle} className='fa fa-bars bullet hover-icon' title='Cloned'/>
          );
          hoverIcon = session.applyHook('renderHoverBullet', hoverIcon, { path, rowInfo });
        }

        // const parents = cachedChild.parentRows;
        // NOTE: this is not actually correct!
        // should use isClone, which is different since a parent may be detached
        // if (parents.length > 1 && !this.props.viewOnly) {
        //   cloneIcon = (
        //     <i key='clone' className='fa fa-clone bullet clone-icon' title='Cloned'/>
        //   );
        // }

        const style: React.CSSProperties = {};
        const finalIcon = (this.props.topLevel && this.props.iconTopLevel) ?
              this.props.iconTopLevel :
              (cachedChild.childRows.length ?
                  (cachedChild.collapsed ? this.props.iconDirFold : this.props.iconDirUnFold)
                  : this.props.iconNoTopLevel);

        const onBulletClick = () => {
          console.log('onBulletClick');
          if (!this.props.session.dragging) {
            this.props.onBulletClick?.(path);
          }
        };
        if (finalIcon === 'fa-circle-o') {
          style.transform = 'scale(0.4)';
        }
        let bullet = (
          <i
            className={`fa ${finalIcon} bullet`} key='bullet'
            style={style} onClick={onBulletClick}
            data-ancestry={JSON.stringify(path.getAncestry())}
          >
          </i>
        );
        if (finalIcon === 'fa-circle') {
          Object.assign(style, getStyles(session.clientStore, ['theme-text-primary']));
          style.width = '18px';
          style.height = '18px';
          style.borderRadius = '9px';
          bullet = (
            <a className={`bullet bullet-fa-circle ${(cachedChild.childRows.length && cachedChild.collapsed) ? 'bullet-folded' : '' }`}
               style={style} key='bullet' onClick={onBulletClick}>
              <svg viewBox='0 0 18 18' fill={'currentColor'}>
                <circle cx='9' cy='9' r='3.5'></circle>
              </svg>
            </a>
          );
        }
        if (!this.props.viewOnly) {
          bullet = (
              <Draggable
                position={{x: 0, y: 0}}
                positionOffset={session.dragging && session.cursor.path.is(path) ? {x: 0, y: 20} : {x: 0, y: 0}}
                onDrag={(_ , ui) => {
                  if (Math.abs(ui.deltaX) + Math.abs(ui.deltaY) > 0 && !session.dragging) {
                    session.selecting = true;
                    session.selectInlinePath = null;
                    session.dragging = true;
                    session.cursor.setPosition(path, 0).then(() => {
                      session.setAnchor(path, 0);
                      session.emit('updateInner');
                    });
                  }
                }}
                onStop={() => {
                  if (session.dragging) {
                    if (session.hoverRow) {
                      const target = session.hoverRow;
                      session.yankCopy().then(() => {
                        session.yankDelete().then(() => {
                          session.selecting = false;
                          session.dragging = false;
                          session.cursor.setPosition(target, 0).then(() => {
                            session.pasteAfter().then(() => {
                              session.emit('updateInner');
                            });
                          });
                        });
                      });
                    }
                  }
                }}
              >
                {bullet}
              </Draggable>
            );
        }
        bullet = session.applyHook('renderBullet', bullet, { path, rowInfo });
        return (
          <div key={path.row} className={'block-with-icon'}>
            {hoverIcon}
            {foldIcon}
            {/*{cloneIcon}*/}
            {bullet}
            <BlockComponent key='block'
                            filteredRows={this.props.filteredRows}
                            iconTopLevel={this.props.iconTopLevel}
                            iconDirFold={this.props.iconDirFold}
                            iconDirUnFold={this.props.iconDirUnFold}
                            iconNoTopLevel={this.props.iconNoTopLevel}
                            cached={cachedChild}
                            topLevel={false}
                            cursorsTree={cursorsTree.getChild(path.row)}
                            onCharClick={this.props.onCharClick}
                            onLineClick={this.props.onLineClick}
                            onBulletClick={this.props.onBulletClick}
                            onFoldClick={this.props.onFoldClick}
                            session={session} path={path}
                            cursorBetween={this.props.cursorBetween}
                            fetchData={this.props.fetchData}
                            viewOnly={this.props.viewOnly}
                            parentBoardNode={cached.pluginData.links?.is_board || false}
                            indexInParent={cached.pluginData.links?.is_order ? index + 1 : undefined}
           />
          </div>
        );
        } else {
          return null;
        }
      });

      if (!childrenLoaded) {
        this.props.fetchData();
        childrenDivs = [<Spinner key='spinner'/>];
      }
      const classes = ['block'];
      if (cached.pluginData.links?.is_board) {
        classes.push('board-block');
      }
      if (this.props.parentBoardNode) {
        classes.push('board-vertical-block');
      }
      pathElements.push(
        <div key='children' className={this.props.viewOnly ? 'dense_block' : classes.join(' ')}>
          {childrenDivs}
        </div>
      );
    }

    const style = {};
    if (cursorsTree.visual) {
      Object.assign(style, getStyles(session.clientStore, ['theme-bg-highlight']));
    }
    return (
      <div className='node' style={style}>
        {pathElements}
      </div>
    );
  }
}

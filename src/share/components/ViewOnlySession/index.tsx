import * as React from 'react';

import {promiseDebounce} from '../../ts/utils/functional';
import logger from '../../ts/utils/logger';

import * as Modes from '../../ts/modes';
import BlockComponent from '../Block/block';
import Spinner from '../Spinner';
import Session from '../../ts/session';
import Path from '../../ts/path';
import {CursorsInfoTree} from '../../ts/cursor';

// TODO: move mode-specific logic into mode render functions

type Props = {
  session: Session;
  onClick: (path: Path) => Promise<any>;
  onBulletClick: (path: Path) => Promise<any>;
  iconTopLevel?: string;
  iconNoTopLevel?: string;
  iconDirFold?: string;
  iconDirUnFold?: string;
  nothingMessage?: string;
};
type State = {
  loaded: boolean;

  // set after data is loaded
  cursorsTree?: CursorsInfoTree;
  crumbContents?: {[row: number]: string };
};

type Profiler = (profilerMessage: string) => () => void;

export default class ViewOnlySessionComponent extends React.Component<Props, State> {
  public update: () => void; // this is promise debounced

  private profileRender: boolean; // for debugging
  private getProfiler: (profileRender: boolean) => Profiler;
  private onCharClick: (path: Path, column: number, e: Event) => void;
  private onLineClick: (path: Path) => Promise<void>;
  private onBulletClick: (path: Path) => Promise<void>;
  private onCrumbClick: (path: Path) => Promise<void>;

  constructor(props: Props) {
    super(props);
    this.state = {
      loaded: false,
    };

    this.onCharClick = async (path, _column, _e) => {
      await this.props.onClick(path);
      this.update();
    };

    this.onLineClick = async (path) => {
      await this.props.onClick(path);
      this.update();
    };

    this.onBulletClick = async (path) => {
      await this.props.onBulletClick(path);
      this.update();
    };

    this.onCrumbClick = async () => {};

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
      const finishProfiling = this.getProfiler(this.profileRender)('Update took');
      const cursorsTree = new CursorsInfoTree(Path.rootRow());
      const crumbContents: {[row: number]: string} = {};

      this.setState({
        crumbContents,
        cursorsTree,
        loaded: true,
      });

      finishProfiling();
    });
  }

  private async fetchAndRerender() {
    const session = this.props.session;
    const finishProfiling = this.getProfiler(this.profileRender)('forceLoadTree took');

    await session.document.forceLoadTree(Path.rootRow(), true);

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

    const crumbContents = this.state.crumbContents;
    if (crumbContents == null) {
      throw new Error('crumbContents should have been loaded');
    }

    const cursorsTree = this.state.cursorsTree;
    if (cursorsTree == null) {
      throw new Error('cursorsTree should have been loaded');
    }

    const mode = session.mode;
    const viewRoot = Path.root();
    const cachedRow = session.document.cache.get(viewRoot.row);
    if (cachedRow === null) {
      this.fetchAndRerender();
      return <Spinner/>;
    }

    const cursorBetween = this.cursorBetween();

    let onLineClick: ((path: Path) => void) | undefined = undefined;
    let onCharClick: ((path: Path, column: number, e: Event) => void) | undefined = undefined;
    if (mode === 'NORMAL' ||
        mode === 'INSERT' ||
        mode === 'VISUAL' ||
        mode === 'VISUAL_LINE'
       ) {
      onCharClick = this.onCharClick;
      onLineClick = this.onLineClick;
    }

    // TODO: have an extra breadcrumb indicator when not at viewRoot?
    return (
      <div className={'view-only-session'}>
        <BlockComponent
          session={session}
          cursorsTree={cursorsTree.getPath(viewRoot)}
          cached={session.document.cache.get(viewRoot.row)}
          path={viewRoot}
          cursorBetween={cursorBetween}
          filteredRows={session.search ? session.search.results.rows : undefined}
          topLevel={true}
          onCharClick={onCharClick}
          onLineClick={onLineClick}
          onBulletClick={this.onBulletClick}
          onFoldClick={() => {}}
          fetchData={this.fetchAndRerender}
          viewOnly={true}
          nothingMessage={this.props.nothingMessage}
          iconTopLevel={this.props.iconTopLevel}
          iconNoTopLevel={this.props.iconNoTopLevel}
          iconDirFold={this.props.iconDirFold}
          iconDirUnFold={this.props.iconDirUnFold}
        />
      </div>
    );
  }
}


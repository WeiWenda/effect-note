import * as React from 'react';

import Path from '../share/ts/path';
import Session from '../share/ts/session';
import { getStyles } from '../share/ts/themes';
import Spinner from '../share/components/Spinner';

type CrumbProps = {
  onClick: ((...args: any[]) => void) | undefined,
  session: Session,
  children: React.ReactNode;
};
class CrumbComponent extends React.PureComponent<CrumbProps, {}> {
  public render() {
    const style = {};
    if (this.props.onClick) {
      Object.assign(style, getStyles(this.props.session.clientStore, ['theme-link']));
    }
    return (
      <span>
        <span style={style} onClick={this.props.onClick}>
          {this.props.children}
        </span>
        <i className='fa fa-angle-right'
          style={{marginRight: 15, marginLeft: 15}}/>
      </span>
    );
  }
}

type BreadcrumbsProps = {
  session: Session;
  onCrumbClick: ((...args: any[]) => void) | undefined;
};
type BreadcrumbsState = {
  viewRoot: Path;
  loaded: boolean;
};
export default class BreadcrumbsComponent extends React.Component<BreadcrumbsProps, BreadcrumbsState> {

  constructor(props: BreadcrumbsProps) {
    super(props);
    this.state = {
      viewRoot: props.session.viewRoot,
      loaded: true
    };
    props.session.on('changeViewRoot', async (path: Path) => {
      this.setState({viewRoot: path});
    });
  }

  private async fetchAndRerender() {
    const session = this.props.session;
    await session.document.forceLoadPath(this.state.viewRoot);
    this.setState({
      loaded: true
    });
  }

  public render() {
    if (!this.state.loaded) { return <Spinner/>; }
    const session = this.props.session;
    const crumbNodes: Array<React.ReactNode> = [];
    let path = this.state.viewRoot;
    if (path.parent == null) {
      crumbNodes.push(
          <i key='home' className='fa fa-home'/>
      );
    } else {
      path = path.parent;
      while (path.parent != null) {
        const cachedRow = session.document.cache.get(path.row);
        if (!cachedRow) {
          this.setState({loaded: false});
          this.fetchAndRerender();
          return (<Spinner/>);
        }
        const hooksInfo = {
          path,
          pluginData: cachedRow.pluginData,
        };

        crumbNodes.push(
          <CrumbComponent key={path.row} session={session}
            onClick={this.props.onCrumbClick && this.props.onCrumbClick.bind(this, path)}
          >
          {
            session.applyHook(
              'renderLineContents',
              [cachedRow.info.line.join('')],
              hooksInfo
            )
          }
          </CrumbComponent>
        );
        path = path.parent;
      }
      crumbNodes.push(
        <CrumbComponent key={path.row} session={session}
          onClick={this.props.onCrumbClick && this.props.onCrumbClick.bind(this, path)}
        >
          <i className='fa fa-home'/>
        </CrumbComponent>
      );
      crumbNodes.reverse();
    }
    return (
      <div className='breadcrumb' key='breadcrumbs' >
        {crumbNodes}
      </div>
    );
  }
}

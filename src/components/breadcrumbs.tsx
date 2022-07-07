import * as React from 'react';

import Path from '../share/ts/path';
import Session from '../share/ts/session';
import { getStyles } from '../share/ts/themes';

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
  viewRoot: Path;
  crumbContents: {[row: number]: string};
  onCrumbClick: ((...args: any[]) => void) | undefined;
};
type BreadcrumbsState = {
  mindMapRef: any;
  loaded: boolean;
  session: Session;
};
export default class BreadcrumbsComponent extends React.Component<BreadcrumbsProps, BreadcrumbsState> {
  constructor(props: BreadcrumbsProps) {
    super(props);
    this.state = {
      session: this.props.session,
      mindMapRef: React.createRef(),
      loaded: false,
    };
  }

  public render() {
    const session = this.props.session;

    const crumbNodes: Array<React.ReactNode> = [];
    let path = this.props.viewRoot;
    if (path.parent == null) {
      crumbNodes.push(
          <i key='home' className='fa fa-home'/>
      );
    } else {
      path = path.parent;
      while (path.parent != null) {
        const cachedRow = session.document.cache.get(path.row);
        if (!cachedRow) {
          throw new Error('Row wasnt cached despite being in crumbs');
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
              [this.props.crumbContents[path.row]],
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

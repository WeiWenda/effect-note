import * as React from 'react';
import {Session} from '../../share';
type DebuggerProps = {
  session: Session;
};

export class SessionDebugger extends React.Component<DebuggerProps, {}> {

  public shouldComponentUpdate(nextProps: DebuggerProps) {
    return true;
  }

  public render() {
    return (
      <div style={{position: 'fixed', top: '0px', left: '500px'}}>
        {
          this.props.session.stopMonitor &&
          <div>
              Stopping keydown monitor
          </div>
        }
        {
          this.props.session.hoverRow &&
          <div>
              Hovering {this.props.session.hoverRow.row}
          </div>
        }
        {
          this.props.session.selecting &&
          <div>
            <div>
                Selecting anchor {this.props.session.getAnchor()?.row} cursor {this.props.session.cursor.row}
            </div>
            {
              this.props.session.selectInlinePath &&
              <div>
                  Inline startCol {this.props.session.getAnchor()?.col} endCol {this.props.session.cursor.col}
              </div>
            }
            {
              this.props.session.selectPopoverOpen &&
              <div>
                  Popover Open
              </div>
            }
          </div>
        }
      </div>
    );
  }
}

import {Path, Session} from '../../ts';
import {getStyles} from '../../ts/themes';
import * as React from 'react';
import {Space} from 'antd';
import {useState} from 'react';
import {FolderOutlined, FolderOpenOutlined, EnterOutlined, CopyOutlined} from '@ant-design/icons';

export function SpecialBlock(props: React.PropsWithChildren<{
  blockType: any, session: Session,
  tools?: any, path: Path, collapse: boolean,
  specialClass?: string,
  setCollapseCallback: (collapse: boolean) => void}>) {
  const [fold, setFold] = useState(props.collapse);
  const [headerVision, setHeaderVision] = useState(props.collapse);
  return (
    <div className={`effect-block-wrapper ${props.specialClass || ''}`} onMouseEnter={() => {
      setHeaderVision(true);
      props.session.stopMonitor = true;
    }} onMouseLeave={() => {
      props.session.stopMonitor = false;
      if (!fold) {
        setHeaderVision(false);
      }
    }} style={{
      borderColor: props.session.clientStore.getClientSetting('theme-bg-secondary')
    }}>
      <div className={`${fold ? 'effect-block-placehoder' : 'effect-block-header'} ${headerVision ? '' : 'effect-block-header-hidden'}`}
           onDoubleClick={() => {
             if (fold) {
               setFold(false);
               props.setCollapseCallback(false);
             }
           }}
           style={{
        height: `${props.session.clientStore.getClientSetting('lineHeight')}px`
      }}>
        <Space style={{opacity: 1}}>
          {
            // !props.session.lockEdit &&
            props.blockType
          }
          {
            fold &&
            <FolderOutlined onClick={() => {
              setFold(false);
              props.setCollapseCallback(false);
            }} />
          }
          {
            !fold &&
            <FolderOpenOutlined onClick={() => {
              setFold(true);
              props.setCollapseCallback(true);
            }} />
          }
          {
            !props.session.lockEdit &&
            props.tools
          }
          <EnterOutlined onClick={() => {
            props.session.cursor.setPosition(props.session.hoverRow!, 0).then(() => {
              props.session.newLineBelow().then(() => {
                props.session.stopAnchor();
                props.session.emit('updateInner');
              });
            });
          }} />
          <CopyOutlined onClick={() => {
            props.session.yankBlocks(props.path, 1).then(() => {
              props.session.showMessage('复制成功');
            });
          }}/>
        </Space>
      </div>
      {
        !fold &&
        <div className={'effect-block-content'} >
          {props.children}
        </div>
      }
    </div>
  );
}

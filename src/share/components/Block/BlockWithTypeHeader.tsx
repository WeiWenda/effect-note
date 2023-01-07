import {Session} from '../../ts';
import {getStyles} from '../../ts/themes';
import * as React from 'react';
import {Space} from 'antd';
import {useState} from 'react';
import {FolderOutlined, FolderOpenOutlined} from '@ant-design/icons';

export function SpecialBlock(props: React.PropsWithChildren<{blockType: string, session: Session, tools: any}>) {
  const [fold, setFold] = useState(false);
  const [headerVision, setHeaderVision] = useState(false);
  return (
    <div className={'effect-block-wrapper'} onMouseEnter={() => {
      setHeaderVision(true);
    }} onMouseLeave={() => {
      if (!fold) {
        setHeaderVision(false);
      }
    }} style={{
      borderColor: props.session.clientStore.getClientSetting('theme-bg-secondary')
    }}>
      <div className={`effect-block-header ${headerVision ? '' : 'effect-block-header-hidden'}`} style={{
        height: `${props.session.clientStore.getClientSetting('lineHeight')}px`
      }}>
        <span style={{opacity: 1}}>
          {
            // !props.session.lockEdit &&
            props.blockType
          }
        </span>
        <Space style={{opacity: 1}}>
          {
            fold &&
            <FolderOutlined onClick={() => {
              setFold(false);
            }} />
          }
          {
            !fold &&
            <FolderOpenOutlined onClick={() => {
              setFold(true);
            }} />
          }
          {
            !props.session.lockEdit &&
            props.tools
          }
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

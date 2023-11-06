import {Path, Session} from '../../ts';
import {getStyles} from '../../ts/themes';
import * as React from 'react';
import {Input, Popover, Space} from 'antd';
import {useState} from 'react';
import {FolderOutlined, FolderOpenOutlined, EnterOutlined, CopyOutlined} from '@ant-design/icons';

export function SpecialBlock(props: React.PropsWithChildren<{
  blockType: any, session: Session,
  title: string,
  tools?: any, path: Path, collapse: boolean,
  specialClass?: string,
  onCopy?: () => void}>) {
  const [fold, setFold] = useState(props.collapse);
  const [headerVision, setHeaderVision] = useState(props.collapse);
  const [popOverOpen, setPopOverOpen] = useState(false);
  const [title, setTitle] = useState(props.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [defaultTitle, setDefaultTitle] = useState(' ');
  const titleElement = (
    <div onClick={() => {
      setEditingTitle(true);
      props.session.stopAnchor();
    }} onMouseLeave={() => {
      setEditingTitle(false);
      props.session.startKeyMonitor();
      if (title !== props.title) {
        props.session.changeChars(props.path.row, 0, props.title.length, (_o) => title.split('')).then(() => {
          props.session.emit('updateInner');
        });
      }
    }} style={{padding: '5px 10px'}}>
      { editingTitle ?
        <Input style={{width: '30em', height: `${props.session.clientStore.getClientSetting('lineHeight')}px`}}
               value={title}
               onFocus={() => {
                 props.session.stopKeyMonitor('special-block-title');
               }}
               onChange={(newValue) => {
                 setTitle(newValue.target.value);
               }}
        /> : title ? title : <span style={{opacity: '0.5'}}>{defaultTitle}</span> }
    </div>
  );
  const content = (
    <div className={`effect-block-wrapper ${props.specialClass || ''}`} onMouseEnter={() => {
      setHeaderVision(true);
      setDefaultTitle('请输入标题');
    }} onMouseLeave={() => {
      if (!props.session.selectPopoverOpen) {
        setHeaderVision(false);
      }
      setDefaultTitle(' ');
    }} style={{
      borderColor: props.session.clientStore.getClientSetting('theme-bg-secondary')
    }}>
      {
        (headerVision || fold) &&
        <div className={'effect-block-placehoder'}
             onDoubleClick={() => {
               if (fold) {
                 props.session.selectPopoverOpen = false;
                 setFold(false);
                 props.session.emit('setBlockCollapse', props.path.row, false);
               }
             }}
             style={{
               height: `${props.session.clientStore.getClientSetting('lineHeight')}px`
             }}>
          {titleElement}
          <Space style={{opacity: 1}}>
            {
              // !props.session.lockEdit &&
              props.blockType
            }
            {
              fold &&
                <FolderOutlined onClick={() => {
                  setFold(false);
                  props.session.emit('setBlockCollapse', props.path.row, false);
                }} />
            }
            {
              !fold &&
                <FolderOpenOutlined onClick={() => {
                  setFold(true);
                  props.session.emit('setBlockCollapse', props.path.row, true);
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
                if (props.onCopy) {
                  props.onCopy();
                }
                props.session.showMessage('复制成功');
              });
            }}/>
          </Space>
        </div>
      }
      {
        !fold && !headerVision && titleElement
      }
      {
        !fold &&
          <div className={'effect-block-content'} >
            {props.children}
          </div>
      }
    </div>
  );
  if (fold) {
    return (
      <Popover placement='top' trigger='hover'
               open={popOverOpen}
               onOpenChange={(e) => {
                 if (e) {
                   props.session.selectPopoverOpen = true;
                   setPopOverOpen(true);
                 } else {
                   props.session.selectPopoverOpen = false;
                   setPopOverOpen(false);
                 }
               }}
               content={
                <div style={{maxHeight: window.innerHeight / 2, width: window.innerWidth / 2, overflowY: 'auto'}}>
                  {props.children}
                </div>
               }
      >
        {content}
      </Popover>
    );
  } else {
    return content;
  }
}

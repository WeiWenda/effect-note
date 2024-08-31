import {Path, Session} from '../../ts';
import {getStyles} from '../../ts/themes';
import * as React from 'react';
import {Input, Popover, Space, Tooltip} from 'antd';
import {useState} from 'react';
import {FolderOutlined, FolderOpenOutlined, EnterOutlined, CopyOutlined} from '@ant-design/icons';

export function SpecialBlock(props: React.PropsWithChildren<{
  blockType: any, session: Session,
  title: string,
  tools?: any, path: Path, collapse: boolean,
  specialClass?: string,
  forSetting?: boolean,
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
    }} style={{padding: '0px 10px'}}>
      { (editingTitle && !props.forSetting) ?
        <Input style={{width: '30em', height: `${props.session.clientStore.getClientSetting('lineHeight')}px`}}
               value={title}
               autoFocus
               onFocus={() => {
                 props.session.stopKeyMonitor('special-block-title');
               }}
               onChange={(newValue) => {
                 setTitle(newValue.target.value);
               }}
        /> : title ? title : (props.session.lockEdit ? <></> : <span style={{opacity: '0.5'}}>{defaultTitle}</span>) }
    </div>
  );
  const content = (
    <div className={`effect-block-wrapper ${props.specialClass || ''}`} onMouseEnter={() => {
      setHeaderVision(true);
      setDefaultTitle('请输入标题');
    }} onMouseLeave={() => {
      // code块切换语言时header需要保证可见
      if (!props.session.selectPopoverOpen) {
        setHeaderVision(false);
      }
      setDefaultTitle(' ');
    }} style={{
      borderColor: props.session.clientStore.getClientSetting('theme-bg-secondary')
    }}>
      {
        // 折叠状态、鼠标进入状态下展示title组件
        (headerVision || fold || props.forSetting) && !props.session.lockEdit &&
        <div className={'effect-block-placehoder'}
             onDoubleClick={() => {
               if (fold) {
                 props.session.setSelectPopoverOpen('');
                 setFold(false);
                 props.session.emit('setBlockCollapse', props.path.row, false);
               }
             }}
             style={{
               height: `${props.session.clientStore.getClientSetting('lineHeight')}px`,
               ...getStyles(props.session.clientStore, ['theme-bg-secondary'])
             }}>
          {
            titleElement
          }
          <Space style={{opacity: 1}}>
            {
              !props.forSetting &&
              props.blockType
            }
            {
              fold && !props.forSetting &&
                <Tooltip title={'折叠特殊块内容'}>
                  <FolderOutlined onClick={() => {
                    setFold(false);
                    props.session.emit('setBlockCollapse', props.path.row, false);
                  }} />
                </Tooltip>
            }
            {
              !fold && !props.forSetting &&
                <Tooltip title={'展开特殊块内容'}>
                  <FolderOpenOutlined onClick={() => {
                    setFold(true);
                    props.session.emit('setBlockCollapse', props.path.row, true);
                  }} />
                </Tooltip>
            }
            {
              !props.forSetting &&
              <Space>
                <Tooltip title={'在下方插入新节点'}>
                  <EnterOutlined onClick={() => {
                    props.session.cursor.setPosition(props.session.hoverRow!, 0).then(() => {
                      props.session.newLineBelow().then(() => {
                        props.session.stopAnchor();
                        props.session.emit('updateInner');
                      });
                    });
                  }} />
                </Tooltip>
                <Tooltip title={'复制当前特殊块至粘贴板'}>
                  <CopyOutlined onClick={() => {
                    props.session.yankBlocks(props.path, 1).then(() => {
                      if (props.onCopy) {
                        props.onCopy();
                      }
                      props.session.showMessage('复制成功');
                    });
                  }}/>
                </Tooltip>
              </Space>
            }
            {
              !props.session.lockEdit &&
              props.tools
            }
          </Space>
        </div>
      }
      {
        ((!fold && !headerVision && !props.forSetting) || props.session.lockEdit) && titleElement
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
                   props.session.setSelectPopoverOpen('special-block-fold-hover');
                   setPopOverOpen(true);
                 } else {
                   props.session.setSelectPopoverOpen('');
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

import {Col, DocInfo, Path, Session} from '../../ts';
import {BoldOutlined, FontColorsOutlined,
  HighlightOutlined, ItalicOutlined, DeleteOutlined, LinkOutlined, CheckOutlined, CopyOutlined} from '@ant-design/icons';
import {Space, Popover, Input, Button} from 'antd';
import * as React from 'react';
import {useState} from 'react';
import {copyToClipboard} from '../../../components/index';

export function FontStyleToolComponent(
  props: React.PropsWithChildren<{session: Session, path: Path, startCol: Col, endCol: Col,
    textContent: string,
    showDelete: boolean,
    link?: string,
    trigger: string | string[],
  }>) {
  const [allClasses, setAllClasses] = useState<string[]>([]);
  const [link, setLink] = useState<string | undefined>(props.link);
  const [open, setOpen] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const switchClass = (newClass: string) => {
    return () => {
      let newClasses: string[] = allClasses;
      if (newClass) {
        if (allClasses.includes(newClass)) {
          newClasses = allClasses.filter(c => c !== newClass);
        } else {
          const type = newClass.split('-').pop()!;
          newClasses = [newClass, ...allClasses.filter(c => !c.endsWith(type))];
        }
      }
      setAllClasses(newClasses);
      props.session.changeChars(props.path!.row, props.startCol, props.endCol - props.startCol, () => {
        if (link) {
          return `<a class='${newClasses.join(' ')}' target="_blank" href="${link}">${props.textContent}</a>`.split('');
        } else {
          return `<span class='${newClasses.join(' ')}'>${props.textContent}</span>`.split('');
        }
      }).then(() => {
        props.session.stopAnchor();
        props.session.selecting = false;
        props.session.emit('updateInner');
      });
    };
  };
  return (
      <Popover placement='top' trigger={props.trigger}
               open={open}
               className={`node-html`}
               onOpenChange={(e) => {
                 if (e) {
                   props.session.selectPopoverOpen = true;
                   setOpen(true);
                 } else {
                   if (!showLink) {
                     props.session.selectPopoverOpen = false;
                     setOpen(false);
                   }
                 }
               }}
               content={
        <div className={'rtf-toolbox node-html'} style={{display: 'flex', flexDirection: 'column'}}>
          <Space>
            <BoldOutlined onClick={switchClass('bold')}/>
            <ItalicOutlined onClick={switchClass('italic')}/>
            <Popover open={showLink}
                     trigger={'click'}
                     onOpenChange={e => {
                       if (e) {
                         props.session.stopKeyMonitor('add-link');
                       } else {
                         props.session.startKeyMonitor();
                       }
                       setShowLink(e);
                     }}
                     content={
              <Input
                value={link}
                onChange={(v) => {
                  setLink(v.target.value);
                }}
                addonBefore='链接到:' addonAfter={
                <CheckOutlined onClick={() => {
                  props.session.startKeyMonitor();
                  props.session.selectPopoverOpen = false;
                  switchClass('')();
                  setShowLink(false);
                }}/>
              }/>
            }>
              <LinkOutlined />
            </Popover>
            <FontColorsOutlined onClick={switchClass('red-color')} className={'red-color'}/>
            <FontColorsOutlined onClick={switchClass('yellow-color')} className={'yellow-color'}/>
            <FontColorsOutlined onClick={switchClass('green-color')} className={'green-color'}/>
            <FontColorsOutlined onClick={switchClass('blue-color')} className={'blue-color'}/>
            <FontColorsOutlined onClick={switchClass('purple-color')} className={'purple-color'}/>
            <FontColorsOutlined onClick={switchClass('grey-color')} className={'grey-color'}/>
            <HighlightOutlined onClick={switchClass('red-background')} className={'red-background'}/>
            <HighlightOutlined onClick={switchClass('yellow-background')} className={'yellow-background'}/>
            <HighlightOutlined onClick={switchClass('green-background')} className={'green-background'}/>
            <HighlightOutlined onClick={switchClass('cyan-background')} className={'cyan-background'}/>
            <HighlightOutlined onClick={switchClass('blue-background')} className={'blue-background'}/>
            <HighlightOutlined onClick={switchClass('purple-background')} className={'purple-background'}/>
            <CopyOutlined onClick={() => {
               copyToClipboard(props.textContent);
               props.session.showMessage('复制成功');
            }}/>
            {
              props.showDelete &&
              <DeleteOutlined onClick={() => {
                setAllClasses([]);
                props.session.changeChars(props.path!.row, props.startCol, props.endCol - props.startCol, () => {
                  return props.textContent.split('');
                }).then(() => {
                  props.session.emit('updateInner');
                });
              }}/>
            }
          </Space>
        </div>
      }>
        {props.children}
      </Popover>
  );
}
import {Col, DocInfo, Path, Session} from '../../ts';
import {BoldOutlined, FontColorsOutlined,
  HighlightOutlined, ItalicOutlined, DeleteOutlined, LinkOutlined, CheckOutlined, CopyOutlined, MessageOutlined} from '@ant-design/icons';
import {Space, Popover, Input, Button} from 'antd';
import * as React from 'react';
import {useState} from 'react';
import {copyToClipboard} from '../../../components/index';

export function FontStyleToolComponent(
  props: React.PropsWithChildren<{session: Session, path: Path, startCol: Col, endCol: Col,
    textContent: string,
    allClasses: string[],
    showDelete: boolean,
    link?: string,
    trigger: string | string[],
  }>) {
  const [link, setLink] = useState<string | undefined>(props.link);
  // const [comment, setComment] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [showLink, setShowLink] = useState(false);
  // const [showComment, setShowComment] = useState(false);
  const switchClass = (newClass: string) => {
    return () => {
      let newClasses: string[] = [];
      if (newClass) {
        if (newClasses.includes(newClass)) {
          newClasses = props.allClasses.filter(c => c !== newClass);
        } else {
          const type = newClass.split('-').pop()!;
          newClasses = [newClass, ...props.allClasses.filter(c => !c.endsWith(type))];
        }
      }
      props.session.changeChars(props.path!.row, props.startCol, props.endCol - props.startCol, () => {
        if (link) {
          return `<a class='${newClasses.join(' ')}' target="_blank" href="${link}">${props.textContent}</a>`.split('');
        } else {
          return `<span class='${newClasses.join(' ')}'>${props.textContent}</span>`.split('');
        }
      }).then(() => {
        props.session.stopAnchor();
        setTimeout(() => {
          props.session.selectPopoverOpen = false;
        }, 200);
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
            {/*<Popover open={showComment}*/}
            {/*         trigger={'click'}*/}
            {/*         onOpenChange={e => {*/}
            {/*           if (e) {*/}
            {/*             props.session.stopKeyMonitor('add-comment');*/}
            {/*           } else {*/}
            {/*             props.session.startKeyMonitor();*/}
            {/*           }*/}
            {/*           setShowComment(e);*/}
            {/*         }}*/}
            {/*         content={*/}
            {/*           <Input*/}
            {/*             value={comment}*/}
            {/*             onChange={(v) => {*/}
            {/*               setComment(v.target.value);*/}
            {/*             }}*/}
            {/*             addonBefore='备注内容:' addonAfter={*/}
            {/*             <CheckOutlined onClick={() => {*/}
            {/*               props.session.startKeyMonitor();*/}
            {/*               props.session.selectPopoverOpen = false;*/}
            {/*               props.session.emitAsync('addComment', props.path.row, props.startCol, props.endCol, comment).then(() => {*/}
            {/*                 props.session.emit('updateInner');*/}
            {/*               });*/}
            {/*               setShowComment(false);*/}
            {/*             }}/>*/}
            {/*           }/>*/}
            {/*         }>*/}
            {/*</Popover>*/}
            <MessageOutlined onClick={() => {
              props.session.emitAsync('addComment', props.path.row, props.startCol, props.endCol, '').then(() => {
                props.session.stopAnchor();
                props.session.selecting = false;
                props.session.emit('updateInner');
              });
            }}/>
            <Popover
              trigger={'hover'}
              content={
                <Space className={'rtf-toolbox node-html'}>
                  <FontColorsOutlined onClick={switchClass('red-color')} className={'red-color'}/>
                  <FontColorsOutlined onClick={switchClass('yellow-color')} className={'yellow-color'}/>
                  <FontColorsOutlined onClick={switchClass('green-color')} className={'green-color'}/>
                  <FontColorsOutlined onClick={switchClass('blue-color')} className={'blue-color'}/>
                  <FontColorsOutlined onClick={switchClass('purple-color')} className={'purple-color'}/>
                  <FontColorsOutlined onClick={switchClass('grey-color')} className={'grey-color'}/>
                </Space>
              }
            >
              <FontColorsOutlined/>
            </Popover>
            <Popover
               trigger={'hover'}
               content={
                 <Space className={'rtf-toolbox node-html'}>
                  <HighlightOutlined onClick={switchClass('red-background')} className={'red-background'}/>
                  <HighlightOutlined onClick={switchClass('yellow-background')} className={'yellow-background'}/>
                  <HighlightOutlined onClick={switchClass('green-background')} className={'green-background'}/>
                  <HighlightOutlined onClick={switchClass('cyan-background')} className={'cyan-background'}/>
                  <HighlightOutlined onClick={switchClass('blue-background')} className={'blue-background'}/>
                  <HighlightOutlined onClick={switchClass('purple-background')} className={'purple-background'}/>
                 </Space>
               }
            >
              <img style={{position: 'relative', top: '4px'}}
                   onClick={e => e.preventDefault()}
                   src={`${process.env.PUBLIC_URL}/images/font_background.png`} height={24} />
            </Popover>
            <CopyOutlined onClick={() => {
               copyToClipboard(props.textContent);
               props.session.showMessage('复制成功');
            }}/>
            {
              props.showDelete &&
              <DeleteOutlined onClick={() => {
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

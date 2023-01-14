import {Col, DocInfo, Path, Session} from '../../ts';
import {BoldOutlined, FontColorsOutlined, HighlightOutlined, ItalicOutlined, DeleteOutlined} from '@ant-design/icons';
import {Space, Popover} from 'antd';
import * as React from 'react';
import {useState} from 'react';

export function FontStyleToolComponent(
  props: React.PropsWithChildren<{session: Session, path: Path, startCol: Col, endCol: Col,
    textContent: string,
    showDelete: boolean
  }>) {
  const [allClasses, setAllClasses] = useState<string[]>([]);
  const switchClass = (newClass: string) => {
    return () => {
      const type = newClass.split('-').pop()!;
      let newClasses: string[] = [];
      if (allClasses.includes(newClass)) {
        newClasses = allClasses.filter(c => c !== newClass);
      } else {
        newClasses = [newClass, ...allClasses.filter(c => !c.endsWith(type))];
      }
      setAllClasses(newClasses);
      props.session.changeChars(props.path!.row, props.startCol, props.endCol - props.startCol, () => {
        return `<span class='${newClasses.join(' ')}'>${props.textContent}</span>`.split('');
      }).then(() => {
        props.session.emit('updateInner');
      });
    };
  };
  return (
      <Popover placement='top' trigger='hover' content={
        <Space className={'rtf-toolbox node-html'}>
          <BoldOutlined onClick={switchClass('bold')}/>
          <ItalicOutlined onClick={switchClass('italic')}/>
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
      }>
        {props.children}
      </Popover>
  );
}

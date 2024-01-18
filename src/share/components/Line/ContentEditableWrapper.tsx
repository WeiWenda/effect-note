import ContentEditable from 'react-contenteditable';
import * as React from 'react';
import {Session} from '../../ts';
import {useState} from 'react';

export function ContentEditableWrapper(props: {index: number, session: Session, cursorStyle: React.CSSProperties}) {
  const [input, setInput] = useState('');
  return (
    <span>
      <ContentEditable id='input-hack'
                       className='input-hack'
                       key='input-hack'
                       html={input}
                       onChange={(e) => {
                         const newVal = e.target.value.replace(/&lt;/g, '<')
                           .replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                         setInput(newVal);
                         if (! new RegExp('[\u4E00-\u9FA5a-zA-Z0-9 ]').test(newVal.substring(0, 1))) {
                           props.session.setHoverRow(props.session.cursor.path, 'input-hack');
                           props.session.addCharsAtCursor(newVal.split('')).then(() => {
                             if (newVal === '/') {
                               props.session.setMode('NODE_OPERATION');
                             }
                             props.session.emit('updateAnyway');
                             setInput('');
                           });
                         }
                       }}
                       onCompositionEnd={(e) => {
                         const newVal = e.data.replace(/&lt;/g, '<')
                           .replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                         e.preventDefault();
                         e.stopPropagation();
                         props.session.setHoverRow(props.session.cursor.path, 'input-hack');
                         // simply insert the key
                         props.session.addCharsAtCursor(newVal.split('')).then(() => {
                           props.session.emit('updateAnyway');
                           setInput('');
                         });
                       }}></ContentEditable>
      <div key={`insert-cursor-${props.index}`}
           className='cursor blink-background'
           style={{
             display: 'inline-block', width: 2, marginLeft: -1, marginRight: -1,
             lineHeight: `${props.session.clientStore.getClientSetting('fontSize') + 2}px`,
             ...props.cursorStyle,
           }}>
        {' '}
      </div>
    </span>
  );
}

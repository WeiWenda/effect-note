import {Col, Row, Session} from '../../share';
import {useEffect, useRef, useState} from 'react';

export function ClozeBox(props: {session: Session, row: Row, startCol: Col, cloze: {text: string, showAnswer: boolean}}) {
  const [show, setShow] = useState(props.cloze.showAnswer);
  const [text, setText] = useState(props.cloze.answer);
  return (
    <div
      className={'node-html'}
      style={{display: 'inline-block'}}
      onDoubleClick={() => {
        props.session.emitAsync('removeCloze', props.row, props.startCol).then(() => {
          props.session.addChars(props.row, props.startCol, props.cloze.answer).then(() => {
            props.session.emit('updateInner');
          });
        });
      }}
      onClick={() => {
        setShow(!show);
      }}>
       <span className={'yellow-background'} style={show ? {} : {color: 'transparent'}}>
          {text}
        </span>
    </div>
  );
}

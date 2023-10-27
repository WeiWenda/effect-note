import {Col, Row, Session} from '../../share';
import {useRef} from 'react';

export function HeightAnchor(props: {session: Session, row: Row, startCol: Col, text: string}) {
  const componentRef = useRef(null);
  props.session.commentRef[`${props.row}-${props.startCol}`] = componentRef;
  return (
    <span className={'comment_underline'} ref={componentRef}>
      {props.text}
    </span>
  );
}

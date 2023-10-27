import {Row, Session} from '../../share';
import {useRef} from 'react';

export function HeightAnchor(props: {session: Session, row: Row}) {
  const componentRef = useRef(null);
  props.session.rowRef[props.row] = componentRef;
  return (
    <div ref={componentRef}/>
  );
}

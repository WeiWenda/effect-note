import {Row, Session} from '../../share';
import {useRef} from 'react';

export function HeightAnchor(props: {session: Session, row: Row}) {
  const componentRef = useRef(null);
  if (!props.session.rowRef.hasOwnProperty(props.row)) {
    props.session.rowRef[props.row] = componentRef;
  }
  return (
    <div ref={componentRef}/>
  );
}

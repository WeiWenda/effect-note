import {Col, Row, Session} from '../../share';
import {useEffect, useRef, useState} from 'react';

export function ClozeBox(props: {session: Session, row: Row, startCol: Col, cloze: {text: string, showAnswer: boolean}}) {
  const [show, setShow] = useState(props.cloze.showAnswer);
  const [text, setText] = useState(props.cloze.answer);
  const [skeletonWidth, setSkeletonWidth] = useState(0);
  const [skeletonHeight, setSkeletonHeight] = useState(0);
  const lengthRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    setTimeout(() => {
      setSkeletonWidth(lengthRef.current?.offsetWidth || 10);
      setSkeletonHeight(lengthRef.current?.offsetHeight || 10);
    }, 100);
  }, [show]);
  return (
    <div
      className={'node-html'}
      style={{display: 'inline-block'}}
      onClick={() => {
        setShow(!show);
      }}>
        {
          !show &&
            <span className={'purple-background'} style={{position: 'absolute', zIndex: '10',
              fontSize: '15px', width: skeletonWidth, height: skeletonHeight,
              background: props.session.clientStore.getClientSetting('theme-bg-tertiary')}}>&nbsp;</span>
        }
        <span ref={lengthRef} className={'yellow-background'}>
          {text}
        </span>
    </div>
  );
}

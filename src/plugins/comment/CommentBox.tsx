import {Avatar, Card} from 'antd';
import React, {useState} from 'react';
import Meta from 'antd/es/card/Meta';
import { EditOutlined, CheckOutlined, DeleteOutlined, RollbackOutlined, CheckCircleOutlined } from '@ant-design/icons';
import ContentEditable from 'react-contenteditable';
import {Col, Row, Session} from '../../share';
import $ from 'jquery';
import {getStyles} from '../../share/ts/themes';

export function CommentBox(props: {session: Session, row: Row, content: string, resolved: boolean,
  createTime: string, startCol: Col, endCol: Col}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(props.content);
  const commentId = `${props.row}-${props.startCol}`;
  const normalActions = [
    <EditOutlined key='edit' onClick={() => {
      setEditing(true);
      setTimeout(() => {
        $(`#commit-edit-${commentId}`).focus();
      }, 100);
    }} />,
    <CheckOutlined key='resolve' onClick={() => {
      props.session.emit('resolveComment', props.row, props.startCol, props.endCol);
    }}/>,
    <DeleteOutlined key='delete' onClick={() => {
      props.session.emit('removeComment', props.row, props.startCol, props.endCol);
    }}/>
  ];
  const editActions = [
    <CheckCircleOutlined key='save' onClick={() => {
      props.session.emitAsync('addComment', props.row, props.startCol, props.endCol, content).then(() => {
        setEditing(false);
      });
    }}/>,
    <RollbackOutlined key='rollback' onClick={() => {
      setContent(props.content);
      setEditing(false);
    }}/>
  ];
  return (
    <Card
      onMouseEnter={() => {
        props.session.commentRef[commentId].current?.classList.add('comment_underline_focus');
      } }
      onMouseLeave={() => {
        props.session.commentRef[commentId].current?.classList.remove('comment_underline_focus');
      } }
      className={'comment-box'}
          actions={props.resolved ? [] : editing ? editActions : normalActions}>
      <Meta
        // avatar={<Avatar>{'CC'}</Avatar>}
        title={
          <div style={{fontSize: 12, ...getStyles(props.session.clientStore, ['theme-text-primary']), opacity: 0.3}}>
            {props.createTime}
          </div>
        }
        description={ !editing ?
          <div
            style={{fontSize: props.session.clientStore.getClientSetting('fontSize'),
              overflow: 'auto',
              opacity: props.resolved ? 0.3 : 1,
              ...getStyles(props.session.clientStore, ['theme-text-primary'])}}
            dangerouslySetInnerHTML={{__html: content}}
          /> : <ContentEditable id={`commit-edit-${commentId}`}
                                onFocus={() => {
                                  props.session.stopKeyMonitor('comment-box');
                                }}
                                onBlur={() => {
                                  props.session.startKeyMonitor();
                                }}
                                style={{...getStyles(props.session.clientStore, ['theme-text-primary'])}}
                                html={content}
                                onChange={(e) => {
                                  setContent(e.target.value);
                                }}
        />}
      />
    </Card>
  );
}

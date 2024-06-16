import {api_utils, DocInfo, Path, Session} from '../../share';
import { Button, Form, Input, Select } from 'antd';
import React, {useEffect, useState} from 'react';
import {onlyUnique} from '../../ts/util';
import {getStyles} from '../../share/ts/themes';

const { Option } = Select;

function FileBaseInfoComponent(props: {
  session: Session,
  tags: string[],
  docInfo: DocInfo,
  onFinish: (docId: number) => void,
  fileType?: string}) {
  const [form] = Form.useForm();
  const children: React.ReactNode[] = props.tags.filter( onlyUnique ).map(tag => {
    return <Option key={tag}>{tag}</Option>;
  });
  const defaultName = props.docInfo?.name || '新的空白文档';
  let defaultTags: string[] = [];
  if (props.docInfo?.tag) {
    defaultTags = JSON.parse(props.docInfo.tag) as Array<string>;
  }
  useEffect(() => {
    form.setFields([
      {name: 'name', value: defaultName},
      {name: 'tags', value: defaultTags}
    ]);
  }, [props.docInfo]);
  return (
    <Form
      layout='vertical'
      style={{
        ...getStyles(props.session.clientStore, ['theme-text-primary'])
      }}
      form={form}
      initialValues={{name: defaultName, tag: defaultTags}}
      onFinish={(values) => {
        if (props.docInfo.id !== undefined) {
          props.session.renameFile(props.docInfo.id, {
            ...props.docInfo,
            tag: JSON.stringify(values.tags),
            name: values.name
          }).then((doc_id) => {
            props.session.showMessage('修改成功');
            props.onFinish(doc_id);
          }).catch(e => {
            props.session.showMessage(e, {warning: true} );
          });
        } else if (props.fileType && props.fileType === 'pkb') {
          props.session.newPKB(values.name || defaultName, values.tags || []).then((doc_id) => {
            props.session.showMessage('创建成功');
            props.onFinish(doc_id);
          }).catch(e => {
            props.session.showMessage(e, {warning: true} );
          });
        } else {
          props.session.newFile(values.name || defaultName, values.tags || []).then((doc_id) => {
            props.session.showMessage('创建成功');
            props.onFinish(doc_id);
          }).catch(e => {
            props.session.showMessage(e, {warning: true} );
          });
        }
      }}
    >
      <Form.Item name='name' label='笔记名称'>
        <Input />
      </Form.Item>
      <Form.Item name='tags' label='分类标签'>
        <Select mode='tags' placeholder='标签可分层，如：目录/子目录'>
          {children}
        </Select>
      </Form.Item>
      <Form.Item>
        <div style={{display: 'flex', justifyContent: 'end'}}>
          <Button htmlType='submit'>{props.docInfo.id !== undefined ? '保存' : '创建'} </Button>
        </div>
      </Form.Item>
    </Form>
  );
}

export default FileBaseInfoComponent;

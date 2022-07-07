import {api_utils, DocInfo, Path, Session} from '../../share';
import { Button, Form, Input, Select } from 'antd';
import React, {useEffect, useState} from 'react';

const { Option } = Select;

function FileBaseInfoComponent(props: {session: Session, tags: string[], docInfo: DocInfo, onFinish: (docId: number) => void}) {
  const [form] = Form.useForm();
  function onlyUnique(value: string, index: number, self: string[]) {
    return self.indexOf(value) === index;
  }
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
      form={form}
      initialValues={{name: defaultName, tag: defaultTags}}
      onFinish={(values) => {
        if (props.docInfo.id !== undefined) {
          props.session.renameFile(props.docInfo.id, {
            ...props.docInfo,
            tag: JSON.stringify(values.tags),
            name: values.name
          }).then((doc_id) => {
            props.onFinish(doc_id);
          });
        } else {
          props.session.newFile(values.name || defaultName, values.tags || []).then((doc_id) => {
            props.onFinish(doc_id);
          });
        }
      }}
    >
      <Form.Item name='name' label='文档名称'>
        <Input />
      </Form.Item>
      <Form.Item name='tags' label='文档类别'>
        <Select mode='tags' placeholder='一级目录/二级目录/../N级目录'>
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

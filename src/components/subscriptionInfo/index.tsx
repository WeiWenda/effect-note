import {DocInfo, Session} from '../../share';
import {Button, Form, Input, Select} from 'antd';
import React from 'react';
import {addSubscription} from '../../share/ts/utils/APIUtils';

export function SubscriptionInfoComponent(props: {session: Session, onFinish: () => void}) {
  const [form] = Form.useForm();
  return (
    <Form
      layout='vertical'
      form={form}
      initialValues={{name: '开发快速参考', path: 'https://github.com/jaywcjlove/reference/tree/main/docs'}}
      onFinish={(values) => {
        const paths = values.path.split('/');
        const gitRemote = paths.slice(0, 5).join('/') + '.git';
        const rootDir = paths.length > 7 ? paths.slice(7, paths.length).join('/') : '';
        addSubscription({name: values.name, gitRemote, rootDir}).then(() => {
          props.onFinish();
        }).catch(res => {
          props.session.showMessage(res.message || res, {warning: true});
        });
      }}
    >
      <Form.Item name='name' label='订阅源名称'>
        <Input />
      </Form.Item>
      <Form.Item name='path' label='订阅源地址'>
        <Input />
      </Form.Item>
      <Form.Item>
        <div style={{display: 'flex', justifyContent: 'end'}}>
          <Button htmlType='submit'>添加</Button>
        </div>
      </Form.Item>
    </Form>
  );
}

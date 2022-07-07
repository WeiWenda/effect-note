import { Button, Form, Input, message, Space } from 'antd';
import * as React from 'react';
import { Session } from '../share';
type FormModalProps = {
  session: Session
};
const UrlFormModal: React.FC<FormModalProps> = ({session}) => {
  const [form] = Form.useForm();
  return (
    <Form
      form={form}
      layout='vertical'
      onFinish={() => {
        session.formSubmitAction(form.getFieldValue('url'));
      }}
      autoComplete='off'
    >
      <Form.Item
        name='url'
        label='请输入扩展阅读的超链接，格式http[s]://domain/path'
        rules={[{ required: true }, { type: 'url' }, { type: 'string', min: 6 }]}
      >
        <Input placeholder='http[s]://domain/path' />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type='primary' htmlType='submit'>
            保存
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
export default UrlFormModal;

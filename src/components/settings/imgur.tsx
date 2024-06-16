import {useEffect, useState } from 'react';
import {Session} from '../../share';
import {ServerConfig} from '../../ts/server_config';
import {Button, Form, Input, Radio } from 'antd';
import {setServerConfig as saveServerConfig} from '../../share/ts/utils/APIUtils';
import * as React from 'react';

export function ImgurComponent(props: { session: Session, serverConfig: ServerConfig}) {
  const [imgurType, setImgurType] = useState(props.serverConfig.imgur?.type || 'local');
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue(props.serverConfig.imgur);
  }, [props.serverConfig]);
  return (
    <>
      {
        process.env.REACT_APP_BUILD_PROFILE === 'demo' &&
          <div className={'node-html'}>
              <span className='red-color'>Demo部署环境下，该功能不可用</span>
          </div>
      }
      <Form
        labelAlign={'left'}
        form={form}
        name='imgur'
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        style={{ maxWidth: 600 }}
        onValuesChange={(changedValues, _values) => {
          if (changedValues.hasOwnProperty('type')) {
            setImgurType(changedValues.type);
            if (changedValues.type === 'local') {
              form.setFieldValue('url', 'http://localhost:51123/api/upload_image');
            } else {
              form.setFieldValue('url', 'http://127.0.0.1:36677/upload');
            }
          }
        }}
        onFinish={(values) => {
          saveServerConfig({...props.serverConfig, imgur: values}).then(() => {
            props.session.emit('refreshServerConfig');
            props.session.showMessage('应用成功');
          });
        }}
        autoComplete='off'
      >
        <Form.Item
          label='图床类型'
          name='type'
        >
          <Radio.Group>
            <Radio value={'local'}>本地图床</Radio>
            <Radio value={'picgo'}>PicGo图床</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label='上传地址'
          name='url'
        >
          <Input disabled={imgurType === 'local'}/>
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 21 }}>
          <Button type='primary' htmlType='submit'>
            应用
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}

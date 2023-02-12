import {Button, Col, Form, Input, Menu, MenuProps, Row, Select, Divider, Dropdown, Modal, Table, Space, Checkbox} from 'antd';
import {EditOutlined, ExclamationCircleOutlined, PlusSquareOutlined, DeleteOutlined, StopOutlined} from '@ant-design/icons';
import * as React from 'react';
import {useEffect, useState, useCallback} from 'react';
import {Session, SubscriptionInfo} from '../../share';
import {EMPTY_WORKSPACE_INFO, ServerConfig, WorkSpaceInfo} from '../../ts/server_config';
import {SERVER_CONFIG} from '../../ts/constants';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import type { ColumnsType } from 'antd/es/table';
import {
  getServerConfig,
  getSubscriptions,
  setServerConfig as saveServerConfig,
  updateSubscriptions,
  workspaceRebuild
} from '../../share/ts/utils/APIUtils';
import { DraggableBodyRow } from './dragRow';

function WorkspaceSettingsComponent(props: { session: Session}) {
  const [serverConfig, setServerConfig] = useState(SERVER_CONFIG);
  const [form] = Form.useForm();
  const [curWorkSpace, setCurWorkSpace] = useState<WorkSpaceInfo | undefined>(undefined);
  useEffect(() => {
    getServerConfig().then((res: ServerConfig) => {
      if (!res.workspaces) {
        res.workspaces = [];
      }
      setServerConfig(res);
      setCurWorkSpace(res.workspaces?.find(i => i.active));
      form.setFieldsValue(res.workspaces?.find(i => i.active));
    });
  }, []);
  const onSelect = (value: String) => {
    const workspace = serverConfig.workspaces?.find(i => i.gitLocalDir === value);
    setCurWorkSpace(workspace);
    form.setFieldsValue(workspace);
    serverConfig.workspaces = [{ active: true, ...workspace} , ...serverConfig.workspaces!
      .filter(i => i.gitLocalDir !== workspace?.gitLocalDir).map(i => {return {active: false, ...i}; })];
    saveServerConfig(serverConfig);
  };
  return (
    <div>
      <div style={{paddingBottom: '1em'}}>当前工作空间：</div>
      <Row style={{alignItems: 'center'}}>
        <Col>
          <Select
            value={curWorkSpace?.gitLocalDir}
            style={{ maxWidth: 600 }}
            onChange={onSelect}
            options={
              serverConfig.workspaces?.map(info => {
                return {
                  value: info.gitLocalDir,
                  label: info.gitLocalDir
                };
              })}
          />
        </Col>
        <Col>
          <Dropdown.Button
            menu={{ items: [{
                key: 'rebuild',
                label: '重建',
              }, {
                key: 'delete',
                label: '删除',
              }, {
                key: 'duplicate',
                label: '复制'
              }], onClick: (e) => {
                switch (e.key) {
                  case 'rebuild':
                    Modal.confirm({
                      title: `${curWorkSpace?.gitLocalDir} 将被重建，请确认！`,
                      icon: <ExclamationCircleOutlined />,
                      okText: '确认',
                      cancelText: '取消',
                      onOk: () => {
                        workspaceRebuild().then(() => {
                          props.session.showMessage('重建成功');
                        });
                      }
                    });
                    break;
                  case 'delete':
                    if (serverConfig.workspaces?.length && serverConfig.workspaces.length > 1) {
                      serverConfig.workspaces = [...serverConfig.workspaces!
                        .filter(i => i.gitLocalDir !== curWorkSpace?.gitLocalDir).map(i => {return {active: false, ...i}; })];
                      serverConfig.workspaces[0].active = true;
                      saveServerConfig(serverConfig);
                    }
                    break;
                  case 'duplicate':
                    const workspace = {...curWorkSpace, gitLocalDir: curWorkSpace?.gitLocalDir + '(copy)'};
                    serverConfig.workspaces?.push(workspace);
                    setServerConfig(serverConfig);
                    setCurWorkSpace(workspace);
                    form.setFieldsValue(workspace);
                    break;
                  default:
                  // do nothing
                }
              }
            }}><PlusSquareOutlined onClick={() => {
            serverConfig.workspaces?.push(EMPTY_WORKSPACE_INFO);
            setServerConfig(serverConfig);
            setCurWorkSpace(EMPTY_WORKSPACE_INFO);
            form.setFieldsValue(EMPTY_WORKSPACE_INFO);
          }} /></Dropdown.Button>
        </Col>
      </Row>
      <Divider />
      {
        curWorkSpace &&
          <Form
              labelAlign={'left'}
              form={form}
              name='basic'
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
              style={{ maxWidth: 600 }}
              onFinish={(values) => {
                if (values.gitLocalDir !== '未配置') {
                  serverConfig.workspaces = [{ active: true, ...values} , ...serverConfig.workspaces!
                    .filter(i => i.gitLocalDir !== curWorkSpace.gitLocalDir).map(i => {return {active: false, ...i}; })];
                  saveServerConfig(serverConfig).then(() => {
                    props.session.showMessage('应用成功');
                  });
                } else {
                  props.session.showMessage('应用失败，请修改配置', {warning: true});
                }
              }}
              autoComplete='off'
          >
              <Form.Item
                  label='本地目录'
                  name='gitLocalDir'
              >
                  <Input
                      disabled={true}
                      addonAfter={<EditOutlined onClick={() => {
                        if (window.electronAPI) {
                          window.electronAPI.openDirectory().then((files) => {
                            if (!files.cancelled) {
                              form.setFieldValue('gitLocalDir', files.filePaths.pop());
                            }
                          });
                        } else {
                          props.session.showMessage('修改工作空间必须在桌面窗口中进行', {warning: true});
                        }
                      }}/>}/>
              </Form.Item>
              <Form.Item
                  label='Git仓库'
                  name='gitRemote'
              >
                  <Input />
              </Form.Item>

              <Form.Item
                  label='Git登录帐号'
                  name='gitUsername'
              >
                  <Input />
              </Form.Item>

              <Form.Item
                  label='Git登录密码'
                  name='gitPassword'
              >
                  <Input.Password />
              </Form.Item>

              <Form.Item
                  label='保留近多少次修改'
                  name='gitDepth'
              >
                  <Input />
              </Form.Item>

              <Form.Item wrapperCol={{ offset: 21 }}>
                  <Button type='primary' htmlType='submit'>
                      应用
                  </Button>
              </Form.Item>
          </Form>
      }
    </div>
  );
}

export default WorkspaceSettingsComponent;

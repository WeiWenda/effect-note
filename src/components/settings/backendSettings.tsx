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

function BackendSettingsComponent(props: { session: Session}) {
  const [serverConfig, setServerConfig] = useState(SERVER_CONFIG);
  const [subscriptions, setSubscriptions] = useState<SubscriptionInfo[]>([]);
  const [form] = Form.useForm();
  const [curWorkSpace, setCurWorkSpace] = useState<WorkSpaceInfo | undefined>(undefined);
  useEffect(() => {
    getServerConfig().then((res: ServerConfig) => {
      setServerConfig(res);
      setCurWorkSpace(res.workspaces?.find(i => i.active));
      form.setFieldsValue(res.workspaces?.find(i => i.active));
    });
    getSubscriptions().then((res) => {
      setSubscriptions((Object.values(res.data) as SubscriptionInfo[]).sort((a, b) => {
        return (a.order || 0) - (b.order || 0);
      }));
    });
  }, []);
  const saveSubscription = () => {
    const body: any = {};
    subscriptions.forEach((sub, index) => {
      sub.order = index;
      body[sub.name] = sub;
    });
    updateSubscriptions(body).then(() => {
      props.session.showMessage('应用成功');
    });
  };
  const [curMenu, setCurMenu] = useState('workspace');
  const menuItems = [{
    label: '工作空间',
    key: 'workspace'
  }, {
    label: '订阅源',
    key: 'subscription'
  }];
  const onClick: MenuProps['onClick'] = e => {
    setCurMenu(e.key);
  };
  const onSelect = (value: String) => {
    const workspace = serverConfig.workspaces?.find(i => i.gitLocalDir === value);
    setCurWorkSpace(workspace);
    form.setFieldsValue(workspace);
    serverConfig.workspaces = [{ active: true, ...workspace} , ...serverConfig.workspaces!
      .filter(i => i.gitLocalDir !== workspace?.gitLocalDir).map(i => {return {active: false, ...i}; })];
    saveServerConfig(serverConfig);
  };
  const columns: ColumnsType<SubscriptionInfo> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '仓库地址',
      dataIndex: 'gitRemote',
      key: 'gitRemote',
    },
    {
      title: '目录',
      dataIndex: 'rootDir',
      key: 'rootDir',
    },
    {
      title: '禁用/启用',
      key: 'disabled',
      render: (_, record) => (
          <Checkbox defaultChecked={!record.disabled} onChange={() => {
            record.disabled = !record.disabled;
          }}/>
        )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size='middle'>
          <DeleteOutlined onClick={() => {
            const filtered = subscriptions.filter(sub => sub.name !== record.name);
            setSubscriptions([...filtered]);
          }}/>
        </Space>
      ),
    },
  ];
  const components = {
    body: {
      row: DraggableBodyRow,
    },
  };
  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRow = subscriptions[dragIndex];
      setSubscriptions(
        update(subscriptions, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRow],
          ],
        })
      );
    },
    [subscriptions],
  );
  return (
    <Row>
      <Col span={4}>
        <Menu
          selectedKeys={[curMenu]}
          onClick={onClick}
          mode='inline'
          items={menuItems}
        />
      </Col>
      <Col span={20}>
        {
          curMenu === 'workspace' &&
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
                form={form}
                name='basic'
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                style={{ maxWidth: 600 }}
                onFinish={(values) => {
                  serverConfig.workspaces = [{ active: true, ...values} , ...serverConfig.workspaces!
                    .filter(i => i.gitLocalDir !== curWorkSpace.gitLocalDir).map(i => {return {active: false, ...i}; })];
                  saveServerConfig(serverConfig).then(() => {
                    props.session.showMessage('应用成功');
                  });
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
                      window.electronAPI.openDirectory().then((files) => {
                        if (!files.cancelled) {
                          form.setFieldValue('gitLocalDir', files.filePaths.pop());
                        }
                      });
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
        }
        {
          curMenu === 'subscription' &&
          <div>
            <DndProvider backend={HTML5Backend}>
              <Table
                columns={columns}
                dataSource={subscriptions}
                components={components}
                onRow={(_, index) => {
                  const attr = {
                    index,
                    moveRow,
                  };
                  return attr as React.HTMLAttributes<any>;
                }}
              />
            </DndProvider>
            <Button onClick={saveSubscription} style={{float: 'right', marginRight: '1em'}} type='primary'>
              应用
            </Button>
          </div>
        }
      </Col>
    </Row>
  );
}

export default BackendSettingsComponent;

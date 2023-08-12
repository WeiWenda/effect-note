import {Button, Col, Divider, Dropdown, Form, Input, Modal, Radio, Row, Select} from 'antd';
import {EditOutlined, ExclamationCircleOutlined, PlusSquareOutlined} from '@ant-design/icons';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {Session} from '../../share';
import {EMPTY_WORKSPACE_INFO, ServerConfig, WorkSpaceInfo} from '../../ts/server_config';
import {SERVER_CONFIG} from '../../ts/constants';
import {getServerConfig, reindexWorkSpace, setServerConfig as saveServerConfig, workspaceRebuild} from '../../share/ts/utils/APIUtils';

function WorkspaceSettingsComponent(props: { session: Session}) {
  const [serverConfig, setServerConfig] = useState(SERVER_CONFIG);
  const [form] = Form.useForm();
  const [curWorkSpace, setCurWorkSpace] = useState<WorkSpaceInfo | undefined>(undefined);
  const [sycType, setSrcType] = useState('');
  useEffect(() => {
    getServerConfig().then((res: ServerConfig) => {
      if (!res.workspaces) {
        res.workspaces = [];
      }
      setServerConfig(res);
      const activeWorkSpace = res.workspaces?.find(i => i.active);
      setCurWorkSpace(activeWorkSpace);
      setSrcType(activeWorkSpace.sycType || 'never');
      form.setFieldsValue(activeWorkSpace);
    });
  }, []);
  const onSelect = (value: String) => {
    const workspace = serverConfig.workspaces?.find(i => i.gitLocalDir === value);
    setCurWorkSpace(workspace);
    form.setFieldsValue(workspace);
    const updatedWorkSpace = { active: true, ...workspace} as WorkSpaceInfo;
    const updatedWorkSpaces = [...serverConfig.workspaces!.filter(i => i.gitLocalDir !== value)];
    updatedWorkSpaces.forEach(w => w.active = false);
    serverConfig.workspaces = [updatedWorkSpace].concat(updatedWorkSpaces);
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
                key: 'reindex',
                label: '更新索引'
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
                  case 'reindex':
                    reindexWorkSpace().then(res => {
                      props.session.showMessage(res.message);
                    });
                    break;
                  case 'delete':
                    if (serverConfig.workspaces?.length && serverConfig.workspaces.length > 1) {
                      const updatedWorkSpaces = [...serverConfig.workspaces!.filter(i => i.gitLocalDir !== curWorkSpace?.gitLocalDir)];
                      updatedWorkSpaces.forEach(w => w.active = false);
                      serverConfig.workspaces[0].active = true;
                      serverConfig.workspaces = updatedWorkSpaces;
                      saveServerConfig(serverConfig).then(() => {
                        setServerConfig(serverConfig);
                        setCurWorkSpace(serverConfig.workspaces[0]);
                        form.setFieldsValue(serverConfig.workspaces[0]);
                      });
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
              onValuesChange={(changedValues, values) => {
                if (changedValues.hasOwnProperty('sycType')) {
                  setSrcType(changedValues.sycType);
                }
              }}
              onFinish={(values) => {
                if (values.gitLocalDir !== '未配置') {
                  const updatedWorkSpace = { active: true, ...values} as WorkSpaceInfo;
                  const updatedWorkSpaces = [...serverConfig.workspaces!.filter(i => i.gitLocalDir !== curWorkSpace.gitLocalDir)];
                  updatedWorkSpaces.forEach(w => w.active = false);
                  serverConfig.workspaces = [updatedWorkSpace].concat(updatedWorkSpaces);
                  saveServerConfig(serverConfig).then(() => {
                    setServerConfig(serverConfig);
                    setCurWorkSpace(updatedWorkSpace);
                    props.session.showMessage('应用成功');
                  });
                } else {
                  props.session.showMessage('应用失败，请修改配置', {warning: true});
                }
              }}
              autoComplete='off'
          >
            {
              ['darwin', 'win32'].includes(process.env.REACT_APP_BUILD_PLATFORM) &&
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
            }
            {
              process.env.REACT_APP_BUILD_PLATFORM === 'mas' &&
                <Form.Item
                    label='名称'
                    name='gitLocalDir'
                >
                    <Input />
                </Form.Item>
            }
              <Form.Item
                  label='同步方式'
                  name='sycType'
                >
                  <Radio.Group>
                      <Radio value={'never'}>不同步</Radio>
                      <Radio value={'gitee'}>同步至Gitee</Radio>
                      {/*<Radio value={'github'}>同步至GitHub</Radio>*/}
                  </Radio.Group>
              </Form.Item>
            {
              sycType === 'gitee' &&
                <div>
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
                </div>
              }
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

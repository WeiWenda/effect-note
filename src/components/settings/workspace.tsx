import {Button, Col, Divider, Dropdown, Form, Input, Modal, Radio, Row, Select, Space, Tooltip} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  FolderViewOutlined,
  CloudSyncOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {Session} from '../../share';
import {EMPTY_WORKSPACE_INFO, ServerConfig, WorkSpaceInfo} from '../../ts/server_config';
import {SERVER_CONFIG} from '../../ts/constants';
import {QRCodeCanvas} from 'qrcode.react';
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
          <Space>
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
            <Tooltip title='增加工作空间'>
              <PlusOutlined onClick={() => {
                serverConfig.workspaces?.push(EMPTY_WORKSPACE_INFO);
                setServerConfig(serverConfig);
                setCurWorkSpace(EMPTY_WORKSPACE_INFO);
                form.setFieldsValue(EMPTY_WORKSPACE_INFO);
              }} />
            </Tooltip>
            <Tooltip title='重建查找索引'>
              <ReloadOutlined onClick={() => {
                reindexWorkSpace().then(res => {
                  props.session.showMessage(res.message);
                });
              }} />
            </Tooltip>
            {
              serverConfig.workspaces?.length && serverConfig.workspaces.length > 1 &&
              <Tooltip title='删除当前工作空间'>
                <DeleteOutlined onClick={() => {
                  Modal.confirm({
                    title: `${curWorkSpace?.gitLocalDir} 将被删除，请确认！`,
                    icon: <ExclamationCircleOutlined/>,
                    okText: '确认',
                    cancelText: '取消',
                    onOk: () => {
                      const updatedWorkSpaces = [...serverConfig.workspaces!.filter(i => i.gitLocalDir !== curWorkSpace?.gitLocalDir)];
                      updatedWorkSpaces.forEach(w => w.active = false);
                      // @ts-ignore
                      serverConfig.workspaces[0].active = true;
                      serverConfig.workspaces = updatedWorkSpaces;
                      saveServerConfig(serverConfig).then(() => {
                        setServerConfig(serverConfig);
                        // @ts-ignore
                        setCurWorkSpace(serverConfig.workspaces[0]);
                        // @ts-ignore
                        form.setFieldsValue(serverConfig.workspaces[0]);
                      });
                    }
                  });
                }}/>
              </Tooltip>
            }
            <Tooltip title='重建当前工作空间（rm -rf && git clone）'>
              <CloudSyncOutlined onClick={() => {
                Modal.confirm({
                  title: `${curWorkSpace?.gitLocalDir} 将被重建，请确认！`,
                  icon: <ExclamationCircleOutlined />,
                  okText: '确认',
                  cancelText: '取消',
                  onOk: () => {
                    props.session.emit('openModal', 'loading');
                    workspaceRebuild().then(() => {
                      props.session.emit('closeModal', 'loading');
                      props.session.showMessage('重建成功');
                    });
                  }
                });
              }}/>
            </Tooltip>
            <Tooltip title='在文件浏览器打开'>
              <FolderViewOutlined onClick={() => {
                if (curWorkSpace?.gitLocalDir) {
                  window.electronAPI.openInFinder(curWorkSpace?.gitLocalDir);
                }
              }} />
            </Tooltip>
          </Space>
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
                      <Radio value={'gitee'}>同步至Git远程仓库</Radio>
                      {/*<Radio value={'github'}>同步至GitHub</Radio>*/}
                  </Radio.Group>
              </Form.Item>
            {
              sycType === 'gitee' &&
                <div>
                  <Form.Item
                      label='仓库地址'
                      name='gitRemote'
                  >
                      <Input />
                  </Form.Item>
                  <Form.Item
                      label='登录帐号'
                      name='gitUsername'
                  >
                      <Input />
                  </Form.Item>

                  <Form.Item
                      label='AccessToken'
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
      {
        sycType === 'gitee' &&
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{paddingBottom: '5px'}}>
            手机客户端请扫描
          </div>
          <QRCodeCanvas value={`http://localhost:51223/workspace?gitLocalDir=${
            curWorkSpace.gitLocalDir.split('/').pop()}&gitRemote=${curWorkSpace.gitRemote}&gitPassword=${
              encodeURIComponent(curWorkSpace.gitPassword!)
            }&gitUsername=${curWorkSpace.gitUsername}`} />
          <div style={{paddingTop: '5px'}} className={'node-html'}>
            <span className='red-color'>注意：二维码包含密钥信息，请勿随便分享给他人</span>
          </div>
        </div>
      }
    </div>
  );
}

export default WorkspaceSettingsComponent;

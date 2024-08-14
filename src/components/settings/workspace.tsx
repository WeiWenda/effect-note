import {Button, Col, Divider, Form, Input, Modal, Radio, Row, Select, Space, Tooltip} from 'antd';
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
import {QRCodeCanvas} from 'qrcode.react';
import {reindexWorkSpace, setServerConfig as saveServerConfig, workspaceRebuild} from '../../share/ts/utils/APIUtils';
import localforage from 'localforage';

function WorkspaceSettingsComponent(props: { session: Session, serverConfig: ServerConfig}) {
  const [form] = Form.useForm();
  const [curWorkSpace, setCurWorkSpace] = useState<WorkSpaceInfo | undefined>(
    props.serverConfig.workspaces?.find(i => i.active)
  );
  const [sycType, setSrcType] = useState('');
  useEffect(() => {
    setSrcType(curWorkSpace?.sycType || 'never');
    form.setFieldsValue(curWorkSpace);
  }, [curWorkSpace]);
  const onSelect = (value: String) => {
    if (curWorkSpace && curWorkSpace.gitLocalDir === value) {
      return;
    }
    const updatedWorkSpaces = props.serverConfig.workspaces!.map(i => {
      if (i.gitLocalDir === value) {
        return {...i, active: true} as WorkSpaceInfo;
      } else {
        return {...i, active: false} as WorkSpaceInfo;
      }
    });
    updatedWorkSpaces.filter(i => i.active).forEach(i => setCurWorkSpace(i));
    const newServerConfig = {...props.serverConfig, workspaces: updatedWorkSpaces};
    saveServerConfig(newServerConfig).then(() => {
      localStorage.clear();
      localforage.clear().then(() => {
        window.location.reload();
      });
    });
  };
  return (
    <div>
      {
         process.env.REACT_APP_BUILD_PROFILE === 'demo' &&
        <div className={'node-html'}>
          <span className='red-color'>Demo部署环境下，该功能不可用</span>
        </div>
      }
      <div style={{paddingBottom: '1em'}}>当前工作空间：</div>
      <Row style={{alignItems: 'center'}}>
        <Col>
          <Space>
            <Select
              value={curWorkSpace?.gitLocalDir}
              style={{ maxWidth: 600, minWidth: 200 }}
              onChange={onSelect}
              options={
                props.serverConfig.workspaces?.map(info => {
                  return {
                    value: info.gitLocalDir,
                    label: info.gitLocalDir
                  };
                })}
            />
            <Tooltip title='增加工作空间'>
              <PlusOutlined onClick={() => {
                setCurWorkSpace(EMPTY_WORKSPACE_INFO);
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
              props.serverConfig.workspaces?.length && props.serverConfig.workspaces.length > 1 &&
              <Tooltip title='删除当前工作空间'>
                <DeleteOutlined onClick={() => {
                  Modal.confirm({
                    title: `${curWorkSpace?.gitLocalDir} 将被删除，请确认！`,
                    icon: <ExclamationCircleOutlined/>,
                    okText: '确认',
                    cancelText: '取消',
                    onOk: () => {
                      const updatedWorkSpaces = [...props.serverConfig.workspaces!
                        .filter(i => i.gitLocalDir !== curWorkSpace?.gitLocalDir)];
                      updatedWorkSpaces.forEach(w => w.active = false);
                      updatedWorkSpaces[0].active = true;
                      setCurWorkSpace(updatedWorkSpaces[0]);
                      saveServerConfig({...props.serverConfig, workspaces: updatedWorkSpaces}).then(() => {
                        props.session.emit('refreshServerConfig');
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
                      localStorage.clear();
                      localforage.clear().then(() => {
                        props.session.emit('closeModal', 'loading');
                        props.session.showMessage('重建成功');
                      });
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
              onValuesChange={(changedValues, _values) => {
                if (changedValues.hasOwnProperty('sycType')) {
                  setSrcType(changedValues.sycType);
                }
                if (changedValues.hasOwnProperty('sycProject')) {
                  form.setFieldValue('gitRemote', 'http://localhost:30124/' + changedValues.sycProject);
                }
              }}
              onFinish={(values) => {
                if (values.gitLocalDir !== '未配置') {
                  const updatedWorkSpace = {...values, active: true} as WorkSpaceInfo;
                  const updatedWorkSpaces = [...props.serverConfig.workspaces!.filter(i => i.gitLocalDir !== curWorkSpace.gitLocalDir)];
                  updatedWorkSpaces.forEach(w => w.active = false);
                  setCurWorkSpace(updatedWorkSpace);
                  saveServerConfig({...props.serverConfig, workspaces: [updatedWorkSpace].concat(updatedWorkSpaces)}).then(() => {
                    props.session.emit('refreshServerConfig');
                    props.session.showMessage('应用成功');
                  });
                } else {
                  props.session.showMessage('应用失败，请修改配置', {warning: true});
                }
              }}
              autoComplete='off'
          >
            {
              ['darwin', 'win32'].includes(process.env.REACT_APP_BUILD_PLATFORM || '') &&
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
                      {
                        ['darwin', 'win32'].includes(process.env.REACT_APP_BUILD_PLATFORM || '') &&
                        <Radio value={'webdav'}>同步至云盘</Radio>
                      }
                      {/*<Radio value={'github'}>同步至GitHub</Radio>*/}
                  </Radio.Group>
              </Form.Item>
            {
              sycType === 'webdav' &&
                <div>
                    <Form.Item
                        label='同步文件夹'
                        name='sycDirectory'
                    >
                        <Input
                            disabled={true}
                            addonAfter={<EditOutlined onClick={() => {
                              if (window.electronAPI) {
                                window.electronAPI.openDirectory().then((files) => {
                                  if (!files.cancelled) {
                                    form.setFieldValue('sycDirectory', files.filePaths.pop());
                                  }
                                });
                              } else {
                                props.session.showMessage('修改工作空间必须在桌面窗口中进行', {warning: true});
                              }
                            }}/>}/>
                    </Form.Item>
                    <Form.Item
                        label='项目名称'
                        name='sycProject'
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label='仓库地址'
                        name='gitRemote'
                    >
                        <Input disabled />
                    </Form.Item>
                </div>
            }
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
        sycType === 'webdav' && curWorkSpace &&
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div style={{paddingTop: '5px'}} className={'node-html'}>
                  <span className='red-color'>注意：修改同步文件夹后需要重启客户端</span>
              </div>
          </div>
      }
      {
        sycType === 'gitee' && curWorkSpace &&
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{paddingBottom: '5px'}}>
            手机客户端请扫描
          </div>
          <QRCodeCanvas value={`http://localhost:51223/workspace?gitLocalDir=${
            curWorkSpace.gitLocalDir!.split('/').pop()}&gitRemote=${curWorkSpace.gitRemote}&gitPassword=${
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

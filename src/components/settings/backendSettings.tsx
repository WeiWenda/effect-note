import {Button, Input, Modal, Row, Col, Menu, MenuProps} from 'antd';
import * as React from 'react';
import {api_utils, ModeId, Session} from '../../share';
import {EditOutlined, ExclamationCircleOutlined} from '@ant-design/icons';
import {appendStyleScript, getStyles, Theme, themes} from '../../share/ts/themes';
import Config from '../../share/ts/config';
import {useEffect, useState} from 'react';
import {ServerConfig} from '../../ts/server_config';
import {SERVER_CONFIG} from '../../ts/constants';
import {applyGitConfig, getServerConfig, setServerConfig as saveServerConfig} from '../../share/ts/utils/APIUtils';

function BackendSettingsComponent(props: { session: Session, config: Config, refreshFunc: () => void }) {
  const [serverConfig, setServerConfig] = useState(SERVER_CONFIG);
  useEffect(() => {
    getServerConfig().then((res: ServerConfig) => {
      setServerConfig(res);
    });
  }, []);
  const [gitRemoteEditing, setGitRemoteEditing] = useState(false);
  const [gitUsernameEditing, setGitUsernameEditing] = useState(false);
  const [gitDepthEditing, setGitDepthEditing] = useState(false);
  const [gitPasswordditing, setGitPasswordEditing] = useState(false);
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
  return (
    <Row>
      <Col>
        <Menu
          selectedKeys={[curMenu]}
          onClick={onClick}
          mode='inline'
          items={menuItems}
        />
      </Col>
      <Col>
        {
          curMenu === 'workspace' &&
          <table className='setting-table'>
            <tbody>
            <tr>
              <td style={{
                ...getStyles(props.session.clientStore, ['theme-text-primary'])
              }}>
                Git仓库
              </td>
              <td>
                <Input value={serverConfig.gitRemote}
                       style={{width: 600}}
                       disabled={!gitRemoteEditing}
                       bordered={false}
                       onChange={(newValue) => {
                         serverConfig.gitRemote = newValue.target.value;
                         setServerConfig({...serverConfig});
                       }}
                       onBlur={() => {
                         saveServerConfig(serverConfig);
                       }}
                       addonAfter={<EditOutlined onClick={() => {
                         setGitRemoteEditing(!gitRemoteEditing);
                       }}/>}/>
              </td>
            </tr>
            <tr>
              <td style={{
                ...getStyles(props.session.clientStore, ['theme-text-primary'])
              }}>
                Git登录帐号
              </td>
              <td>
                <Input value={serverConfig.gitUsername}
                       disabled={!gitUsernameEditing}
                       bordered={false}
                       onChange={(newValue) => {
                         serverConfig.gitUsername = newValue.target.value;
                         setServerConfig({...serverConfig});
                       }}
                       onBlur={() => {
                         saveServerConfig(serverConfig);
                       }}
                       addonAfter={<EditOutlined onClick={() => {
                         setGitUsernameEditing(!gitUsernameEditing);
                       }}/>}/>
              </td>
            </tr>
            <tr>
              <td style={{
                ...getStyles(props.session.clientStore, ['theme-text-primary'])
              }}>
                Git登录密码
              </td>
              <td>
                <Input.Password value={serverConfig.gitPassword}
                                disabled={!gitPasswordditing}
                                onChange={(newValue) => {
                                  serverConfig.gitPassword = newValue.target.value;
                                  setServerConfig({...serverConfig});
                                }}
                                onBlur={() => {
                                  saveServerConfig(serverConfig);
                                }}
                                bordered={false} addonAfter={<EditOutlined onClick={() => {
                  setGitPasswordEditing(!gitPasswordditing);
                }}/>}/>
              </td>
            </tr>
            <tr>
              <td style={{
                ...getStyles(props.session.clientStore, ['theme-text-primary'])
              }}>
                Git本地目录
              </td>
              <td>
                <Input value={serverConfig.gitLocalDir}
                       disabled={true}
                       bordered={false}
                       addonAfter={<EditOutlined onClick={() => {
                         window.electronAPI.openDirectory().then((files) => {
                           if (!files.cancelled) {
                             serverConfig.gitLocalDir = files.filePaths.pop();
                             setServerConfig({...serverConfig});
                             saveServerConfig(serverConfig);
                           }
                         });
                       }}/>}/>
              </td>
            </tr>
            <tr>
                <td style={{
                  ...getStyles(props.session.clientStore, ['theme-text-primary'])
                }}>
                    保留近多少次修改
                </td>
                <td>
                    <Input value={serverConfig.gitDepth}
                           disabled={!gitDepthEditing}
                           bordered={false}
                           onChange={(newValue) => {
                             serverConfig.gitDepth = Number(newValue.target.value);
                             setServerConfig({...serverConfig});
                           }}
                           onBlur={() => {
                             saveServerConfig(serverConfig);
                           }}
                           addonAfter={<EditOutlined onClick={() => {
                             setGitDepthEditing(!gitDepthEditing);
                           }}/>}/>
                </td>
            </tr>
            <tr>
                <td>
                    <Button onClick={() => {
                        Modal.confirm({
                          title: `${serverConfig.gitLocalDir} 将被重建，请确认！`,
                          icon: <ExclamationCircleOutlined />,
                          okText: '确认',
                          cancelText: '取消',
                          onOk: () => {
                            applyGitConfig().then(() => {
                              props.session.showMessage('应用成功');
                            });
                          }
                        });
                    }}>应用Git配置</Button>
                </td>
                <td>
                </td>
            </tr>
            </tbody>
          </table>
        }
        {
          curMenu === 'subscription' &&
          <div/>
        }
      </Col>
    </Row>
  );
}

export default BackendSettingsComponent;

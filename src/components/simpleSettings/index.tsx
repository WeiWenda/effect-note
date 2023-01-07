import {Button, Input, Modal, Switch, Slider, InputNumber, Select} from 'antd';
import * as React from 'react';
import {api_utils, ModeId, Session} from '../../share';
import {EditOutlined, ExclamationCircleOutlined} from '@ant-design/icons';
import {appendStyleScript, getStyles, Theme, themes} from '../../share/ts/themes';
import Config from '../../share/ts/config';
import {useEffect, useState} from 'react';
import {ServerConfig} from '../../ts/server_config';
import {SERVER_CONFIG} from '../../ts/constants';
import {applyGitConfig, getServerConfig, setServerConfig as saveServerConfig} from '../../share/ts/utils/APIUtils';

function SimpleSettingsComponent(props: { session: Session, config: Config, refreshFunc: () => void }) {
  // const navigate = useNavigate();
  const applyTheme = (theme: Theme) => {
    Object.keys(theme).forEach((theme_prop: string) => {
      props.session.clientStore.setClientSetting(theme_prop as keyof Theme, theme[theme_prop as keyof Theme]);
    });
    appendStyleScript(props.session.clientStore);
    props.refreshFunc();
  };
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
  return (
    <div>
      <table className='setting-table'>
        <tbody style={{
          ...getStyles(props.session.clientStore, ['theme-text-primary'])
        }}>
        {/*<tr>*/}
        {/*  <td style={{*/}
        {/*    ...getStyles(props.session.clientStore, ['theme-text-primary'])*/}
        {/*  }}>*/}
        {/*    开启离线模式*/}
        {/*  </td>*/}
        {/*  <td>*/}
        {/*    <Switch style={{*/}
        {/*      backgroundColor: props.session.clientStore.getClientSetting('theme-text-link')*/}
        {/*    }} checkedChildren='Offline' unCheckedChildren='Online' onChange={(checked) => {*/}
        {/*      if (checked) {*/}
        {/*        setTimeout(() => {*/}
        {/*          navigate('/yin');*/}
        {/*        }, 500);*/}
        {/*      } else {*/}
        {/*        // do nothing*/}
        {/*      }*/}
        {/*    }}/>*/}
        {/*  </td>*/}
        {/*</tr>*/}
        <tr>
          <td>
            开启暗黑模式
          </td>
          <td>
            <Switch
                checked={props.session.clientStore.getClientSetting('blackMode')}
                style={{
              backgroundColor: props.session.clientStore.getClientSetting('theme-text-link')
            }} checkedChildren='Dark' unCheckedChildren='Light' onChange={(checked) => {
              if (checked) {
                props.session.clientStore.setClientSetting('blackMode', true);
                applyTheme(themes.Dark);
              } else {
                props.session.clientStore.setClientSetting('blackMode', false);
                applyTheme(themes.Default);
              }
            }}/>
          </td>
        </tr>
        <tr>
          <td>
            内容区英文字体
          </td>
          <td>
            <Select
                style={{ width: '150px' }}
                defaultValue={props.session.clientStore.getClientSetting('fontFamily')}
                onChange={(v: string) => {
                  props.session.clientStore.setClientSetting('fontFamily',  v);
                  appendStyleScript(props.session.clientStore);
                }}
                options={[
                    {
                      label: (
                          <span style={{fontFamily: 'Arial'}}>Arial</span>
                      ),
                      value: 'Arial'
                    },
                    {
                      label: (
                          <span style={{fontFamily: 'Times New Roman'}}>Times New Roman</span>
                      ),
                      value: 'Times New Roman'
                    },
                    {
                      label: (
                          <span style={{fontFamily: 'Garamond'}}>Garamond</span>
                      ),
                      value: 'Garamond'
                    },
                    {
                      label: (
                          <span style={{fontFamily: 'Courier New'}}>Courier New</span>
                      ),
                      value: 'Courier New'
                    },
                    {
                      label: (
                          <span style={{fontFamily: 'Monaco'}}>Monaco</span>
                      ),
                      value: 'Monaco'
                    }
                  ]}
            ></Select>
          </td>
        </tr>
        <tr>
            <td>
                内容区中文字体
            </td>
            <td>
                <Select
                    style={{ width: '250px' }}
                    defaultValue={props.session.clientStore.getClientSetting('fontFamilyZh')}
                    onChange={(v: string) => {
                        props.session.clientStore.setClientSetting('fontFamilyZh',  v);
                        appendStyleScript(props.session.clientStore);
                    }}
                    options={[
                        {
                            label: (
                                <span style={{fontFamily: 'Simsun'}}>宋体</span>
                            ),
                            value: 'Simsun'
                        },
                        {
                            label: (
                                <span style={{fontFamily: 'Simhei'}}>黑体</span>
                            ),
                            value: 'Simhei'
                        },
                        {
                            label: (
                                <span style={{fontFamily: 'Kaiti'}}>楷体</span>
                            ),
                            value: 'Kaiti'
                        },
                        {
                            label: (
                                <span style={{fontFamily: 'PingFang SC'}}>苹方-简（Mac系统字体）</span>
                            ),
                            value: 'PingFang SC'
                        },
                        {
                            label: (
                                <span style={{fontFamily: 'Microsoft Yahei'}}>微软雅黑（Window系统字体）</span>
                            ),
                            value: 'Microsoft Yahei'
                        }
                    ]}
                ></Select>
            </td>
        </tr>
        <tr>
          <td>
            内容区字体大小
          </td>
          <td>
            <InputNumber addonAfter='px'
                         min={8}
                         max={40}
                         onChange={(value) => {
                           if (!value) {
                             return;
                           }
                           props.session.clientStore.setClientSetting('fontSize', value);
                           appendStyleScript(props.session.clientStore);
                         }}
                         defaultValue={props.session.clientStore.getClientSetting('fontSize')} />
          </td>
        </tr>
        <tr>
          <td>
            内容区缩进大小
          </td>
          <td>
            <InputNumber addonAfter='px'
                         min={15}
                         max={100}
                         onChange={(value) => {
                           if (!value) {
                             return;
                           }
                           props.session.clientStore.setClientSetting('blockPaddingLeft', value);
                           appendStyleScript(props.session.clientStore);
                         }}
                         defaultValue={props.session.clientStore.getClientSetting('blockPaddingLeft')} />
          </td>
        </tr>
        <tr>
          <td>
            内容区行间距
          </td>
          <td>
            <InputNumber addonAfter='px'
                         min={props.session.clientStore.getClientSetting('fontSize')}
                         max={100}
                         onChange={(value) => {
                           if (!value) {
                             return;
                           }
                           props.session.clientStore.setClientSetting('lineHeight', value);
                           appendStyleScript(props.session.clientStore);
                         }}
                         defaultValue={props.session.clientStore.getClientSetting('lineHeight')} />
          </td>
        </tr>
        {/*<tr>*/}
        {/*  <td style={{*/}
        {/*    ...getStyles(props.session.clientStore, ['theme-text-primary'])*/}
        {/*  }}>*/}
        {/*    开启Vim模式*/}
        {/*  </td>*/}
        {/*  <td>*/}
        {/*    <Switch style={{*/}
        {/*      backgroundColor: props.session.clientStore.getClientSetting('theme-text-link')*/}
        {/*    }} checkedChildren='On' unCheckedChildren='Off' onChange={(checked) => {*/}
        {/*      if (checked) {*/}
        {/*        props.session.vimMode = true;*/}
        {/*        props.config.defaultMappings.registerModeMappings('INSERT',*/}
        {/*          {'exit-mode': [['esc'], ['ctrl+c'], ['ctrl+[']]});*/}
        {/*      } else {*/}
        {/*        props.session.vimMode = false;*/}
        {/*        props.config.defaultMappings.deregisterModeMappings('INSERT',*/}
        {/*          {'exit-mode': [['esc'], ['ctrl+c'], ['ctrl+[']]});*/}
        {/*        props.session.setMode('INSERT');*/}
        {/*      }*/}
        {/*    }}/>*/}
        {/*  </td>*/}
        {/*</tr>*/}
        </tbody>
      </table>
      {
        process.env.REACT_APP_BUILD_PROFILE === 'local' &&
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
      {/*<div>*/}
      {/*  <Button danger onClick={() => {*/}
      {/*    localStorage.removeItem(api_utils.ACCESS_TOKEN);*/}
      {/*    props.refreshFunc();*/}
      {/*  }}>*/}
      {/*    退出登录*/}
      {/*  </Button>*/}
      {/*</div>*/}
    </div>
  );
}

export default SimpleSettingsComponent;

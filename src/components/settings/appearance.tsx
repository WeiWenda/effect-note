import {Col, Tooltip, InputNumber, Row, Select, Input, Space, Popover, Button, Divider} from 'antd';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {Session} from '../../share';
import { ChromePicker } from 'react-color';
import {appendStyleScript, getStyles, Theme, themes} from '../../share/ts/themes';
import Config from '../../share/ts/config';
import {CopyOutlined, RollbackOutlined, DeleteOutlined, EditOutlined} from '@ant-design/icons';
import {SERVER_CONFIG} from '../../ts/constants';
import {getServerConfig, setServerConfig as saveServerConfig} from '../../share/ts/utils/APIUtils';
import {ServerConfig} from '../../ts/server_config';
import $ from 'jquery';

function AppearanceSettingsComponent(props: { session: Session, config: Config, refreshFunc: () => void }) {
  const [serverConfig, setServerConfig] = useState(SERVER_CONFIG);
  const [editing, setEditing] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>(props.session.clientStore.getClientSetting('curTheme'));
  useEffect(() => {
    getServerConfig().then((res: ServerConfig) => {
      if (!res.themes) {
        res.themes = {...themes};
      }
      setServerConfig(res);
    });
  }, []);
  const applyTheme = (theme: Theme) => {
    Object.keys(theme).forEach((theme_prop: string) => {
      props.session.clientStore.setClientSetting(theme_prop as keyof Theme, theme[theme_prop as keyof Theme]);
    });
    appendStyleScript(props.session.clientStore);
    props.refreshFunc();
  };
  const colorPickerRow = (name: string, theme_property: keyof Theme) => {
    const hex_color = props.session.clientStore.getClientSetting('theme-bg-primary');
    const rgb = parseInt(hex_color.substring(1), 16);
    // tslint:disable no-bitwise
    const r = (rgb >> 16) & 0xff;  // extract red
    const g = (rgb >> 8) & 0xff;  // extract green
    const b = (rgb >> 0) & 0xff;  // extract blue
    // tslint:enable no-bitwise
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
    return (
      <tr className={'setting-theme-key'}>
        <td> {name} </td>
        <td>
          <Popover content={(
            <ChromePicker
              color={ props.session.clientStore.getClientSetting(theme_property) as string }
              onChangeComplete={({ hex: hexColor }: any) => {
                const theme: Theme = serverConfig.themes![currentTheme];
                // @ts-ignore
                theme[theme_property] = (hexColor as string);
                applyTheme(theme);
                saveServerConfig(serverConfig);
              }}
            />
          )} trigger='click'>
            <div style={{
              width: '160px',
              height: '18px',
              border: `1px solid ${luma > 40 ? 'black' : 'white'}`,
              backgroundColor: props.session.clientStore.getClientSetting(theme_property) as string
            }}></div>
          </Popover>
        </td>
        <td />
      </tr>
    );
  };
  const changeTheme = (theme: string) => {
    props.session.clientStore.setClientSetting('curTheme', theme);
    setCurrentTheme(theme);
    applyTheme(serverConfig.themes![theme]);
  };
  const changeThemeProperty = (key: string, value: string | number) => {
    const theme: Theme = serverConfig.themes![currentTheme];
    // @ts-ignore
    theme[key as keyof Theme] = value;
    applyTheme(theme);
    saveServerConfig(serverConfig);
  };
  return (
    <div>
      <div style={{paddingBottom: '1em'}}>当前主题：</div>
      <Row>
        <Col style={{display: 'flex', flexDirection: 'column'}}>
          <Space>
            {
              editing &&
              <Input.Group compact>
                <Input id={'theme-new-name'} style={{ width: '140px' }} defaultValue={currentTheme} />
                <Button onClick={() => {
                  const newThemeName = $('#theme-new-name').val();
                  if (newThemeName) {
                    const theme = serverConfig.themes![currentTheme];
                    delete serverConfig.themes![currentTheme];
                    serverConfig.themes![newThemeName as string] = theme;
                    setServerConfig(serverConfig);
                    saveServerConfig(serverConfig);
                    changeTheme(newThemeName as string);
                  }
                  setEditing(false);
                }} >确定</Button>
              </Input.Group>
            }
            {
              !editing &&
              <Select
                style={{width: '202px'}}
                value={currentTheme}
                options={Object.keys(serverConfig.themes || themes).map(k => {
                  return {value: k, label: k};
                })}
                onChange={changeTheme}
              />
            }
            <Tooltip title='复制当前主题'>
              <CopyOutlined onClick={() => {
                serverConfig.themes![currentTheme + '(copy)'] = {...serverConfig.themes![currentTheme]};
                setCurrentTheme(currentTheme + '(copy)');
                setServerConfig(serverConfig);
                saveServerConfig(serverConfig);
              }}/>
            </Tooltip>
            {
              !themes.hasOwnProperty(currentTheme) &&
              <Tooltip title='删除当前主题'>
                <DeleteOutlined onClick={() => {
                  delete serverConfig.themes![currentTheme];
                  setServerConfig(serverConfig);
                  saveServerConfig(serverConfig);
                  changeTheme('Default');
                }} />
              </Tooltip>
            }
            {
              !themes.hasOwnProperty(currentTheme) &&
              <Tooltip title='修改当前主题名称'>
                <EditOutlined onClick={() => {
                  setEditing(true);
                }} />
              </Tooltip>
            }
            {
              themes.hasOwnProperty(currentTheme) &&
              <Tooltip title='恢复默认'>
                <RollbackOutlined onClick={() => {
                  serverConfig.themes![currentTheme] = {...themes[currentTheme]};
                  setServerConfig(serverConfig);
                  saveServerConfig(serverConfig);
                  changeTheme(currentTheme);
                }} />
              </Tooltip>
            }
          </Space>
        </Col>
      </Row>
      <Divider />
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
        {colorPickerRow('背景色', 'theme-bg-primary')}
        {colorPickerRow('背景色（菜单选中）', 'theme-bg-secondary')}
        {/*{colorPickerRow('Tertiary background color', 'theme-bg-tertiary')}*/}
        {colorPickerRow('背景色（文本选中）', 'theme-bg-highlight')}
        {colorPickerRow('文字颜色', 'theme-text-primary')}
        {colorPickerRow('文字颜色（搜索匹配）', 'theme-text-accent')}
        {/*{colorPickerRow('Trim color', 'theme-trim')}*/}
        {/*{colorPickerRow('Accented trim color', 'theme-trim-accent')}*/}
        {/*{colorPickerRow('Cursor text color', 'theme-text-cursor')}*/}
        {/*{colorPickerRow('Cursor background color', 'theme-bg-cursor')}*/}
        {colorPickerRow('文字颜色（超链接）', 'theme-text-link')}
        <tr className={'setting-theme-key'}>
          <td>
            内容区英文字体
          </td>
          <td>
            <Select
              size={'small'}
              style={{width: '150px'}}
              value={props.session.clientStore.getClientSetting('fontFamily')}
              onChange={(v: string) => changeThemeProperty('fontFamily', v)}
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
        <tr className={'setting-theme-key'}>
          <td>
            内容区中文字体
          </td>
          <td>
            <Select
              size={'small'}
              style={{width: '250px'}}
              value={props.session.clientStore.getClientSetting('fontFamilyZh')}
              onChange={(v: string) => changeThemeProperty('fontFamilyZh', v)}
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
        <tr className={'setting-theme-key'}>
          <td>
            内容区字体大小
          </td>
          <td>
            <InputNumber
              size={'small'}
              addonAfter='px'
              min={8}
              max={40}
              onChange={(v) => {
                if (v) {
                  changeThemeProperty('fontSize', v);
                }
              }}
              value={props.session.clientStore.getClientSetting('fontSize')}/>
          </td>
        </tr>
        <tr className={'setting-theme-key'}>
          <td>
            内容区缩进大小
          </td>
          <td>
            <InputNumber
              size={'small'}
              addonAfter='px'
              min={15}
              max={100}
              onChange={(v) => {
                if (v) {
                  changeThemeProperty('blockPaddingLeft', v);
                }
              }}
              value={props.session.clientStore.getClientSetting('blockPaddingLeft')}/>
          </td>
        </tr>
        <tr className={'setting-theme-key'}>
          <td>
            内容区行间距
          </td>
          <td>
            <InputNumber
              size={'small'}
              addonAfter='px'
              min={props.session.clientStore.getClientSetting('fontSize')}
              max={100}
              onChange={(v) => {
                if (v) {
                  changeThemeProperty('lineHeight', v);
                }
              }}
              value={props.session.clientStore.getClientSetting('lineHeight')}/>
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

export default AppearanceSettingsComponent;
import * as React from 'react';
import {Layout, Menu, Spin, Drawer, Button, Tabs, Modal, notification} from 'antd';
import { SettingOutlined } from '@ant-design/icons';

import '@wangeditor/editor/dist/css/style.css';
import 'vditor/dist/index.css';
import {getStyles} from '../../share/ts/themes';
import {api_utils, DocInfo, KeyHandler, Path, Session} from '../../share';
import {useEffect, useState} from 'react';
// import {ImageOcr} from '../ImageOcr';
import Config from '../../share/ts/config';
import FileBaseInfoComponent from '../fileBaseInfo';
import {PluginsManager} from '../../ts/plugins';
import {Mindmap} from '../mindmap';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import {DrawioEditor} from '../drawioEditor';
import {API_BASE_URL, getServerConfig, setServerConfig as saveServerConfig, uploadImage} from '../../share/ts/utils/APIUtils';
import Vditor from 'vditor';
import {mimetypeLookup} from '../../ts/util';
import logger from '../../ts/logger';
import FileInput from '../fileInput';
import { ExportComponent } from '../export';
import {SubscriptionInfoComponent} from '../subscriptionInfo';
import WorkspaceSettingsComponent from '../settings/workspace';
import AppearanceSettingsComponent from '../settings/appearance';
import { DraggableCore } from 'react-draggable';
import {useLoaderData, useNavigate, useLocation, Outlet } from 'react-router-dom';
import SubscriptionSettingsComponent from '../settings/subscription';
import $ from 'jquery';
import { ImgurComponent } from '../settings/imgur';
import {SERVER_CONFIG} from '../../ts/constants';
import LoomApp from '../obsidian-dataloom/loom-app';
import {store} from '../obsidian-dataloom/redux/store';
import {defaultTagConfig} from '../../ts/server_config';
import {LoomState} from '../obsidian-dataloom/shared/loom-state/types';
const { Header, Footer, Sider, Content } = Layout;
type InsertFnType = (url: string, alt: string, href: string) => void;

export const HeaderItems = [
  { label: 'Notes', key: 'note'},
  { label: 'Discovery', key: 'discovery' }, // 菜单项务必填写 key
  // { label: 'Test', key: 'test' }
];
// @ts-ignore
export async function noteLoader({params}) {
  const res = await api_utils.getCurrentUserDocs();
  return {userDocs: res.content};
};
export function useForceUpdate() {
  const [value, setValue] = useState(0); // integer state
  return () => setValue(value + 1); // update state to force render
}
function LayoutComponent(props: {session: Session, config: Config, pluginManager: PluginsManager}) {
  const forceUpdate = useForceUpdate();
  const navigate = useNavigate();
  const location = useLocation();
  const [curPage, setCurPage] = useState<string>(location.pathname.split('/').shift() || 'note');
  const [settingOpen, setSettingOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(window.innerWidth / 2);
  const [activeSetting, setActiveSetting] = useState('1');
  const [serverConfig, setServerConfig] = useState(SERVER_CONFIG);
  const [showHeader, setShowHeader] = useState(props.session.clientStore.getClientSetting('defaultLayout').includes('top'));
  const [modalVisible, setModalVisible] = useState<{[key: string]: boolean}>({
    'noteInfo': false,
    'ocr': false,
    'rtf': false,
    'md': false,
    'export': false,
    'drawio': false,
    'subscriptionInfo': false,
  });
  const [curDocInfo, setCurDocInfo] = useState({});
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [html, setHtml] = useState('<p>');
  const [xml, setXml] = useState<string | undefined>();
  const [vd, setVd] = React.useState<Vditor>();
  useEffect(() => {
    getServerConfig().then(res => {
      setServerConfig(res);
      props.session.serverConfig = res;
    });
    props.session.on('refreshServerConfig', () => {
      getServerConfig().then(res => {
        setServerConfig(res);
        props.session.serverConfig = res;
        setRefreshing(true);
        setTimeout(() => {
          setRefreshing(false);
        }, 100);
      });
    });
    props.session.on('importFinished', forceUpdate);
    props.session.on('modeChange', () => {
      logger.debug('modeChange');
      props.session.emit('updateInner');
      forceUpdate();
    });
    props.session.on('changeLayout', (layout) => {
      setShowHeader(layout.includes('top'));
    });
    props.session.cursor.on('rowChange', (_oldPath: Path, newPath: Path) => {
        props.session.setHoverRow(newPath, 'cursor');
    });
    props.session.on('updateAnyway', () => {
      logger.debug('updateAnyway');
      props.session.emit('updateInner');
      forceUpdate();
    });
    props.session.on('closeModal', (modalName) => {
      const visible = {...modalVisible};
      visible[modalName] = false;
      setModalVisible(visible);
      props.session.startKeyMonitor();
    });
    props.session.on('openModal', (modalName, data) => {
      if (modalName === 'rtf') {
        setTimeout(() => {
          setHtml(data.html);
        }, 500);
      }
      if (modalName === 'noteInfo') {
        setCurDocInfo(data.docInfo);
      }
      if (modalName === 'md') {
        setTimeout(() => {
          const vditor = new Vditor('vditor', {
            mode: 'sv',
            upload: {
              handler: (files: File[]) => new Promise<null>(resolve => {
                uploadImage(files[0],
                  props.session.clientStore.getClientSetting('curDocId'),
                  props.session.serverConfig.imgur).then(res => {
                    res.data.forEach((file: any) => {
                      vditor.insertValue(`![](${file.url})`);
                    });
                    resolve(null);
                });
              })
            },
            preview: {
              theme : {
                current: props.session.clientStore.getClientSetting('curTheme').includes('Dark') ? 'dark' : 'light',
                path: 'content-theme'
              }},
            cdn: 'http://localhost:51223/vditor',
            theme: props.session.clientStore.getClientSetting('curTheme').includes('Dark') ? 'dark' : 'classic',
            height: window.innerHeight - 360,
            toolbar: ['quote', '|', 'headings', 'bold', 'italic', 'strike', 'inline-code', '|',
              'list', 'ordered-list', 'check' , '|', 'link', 'upload', 'table', 'code', '|',
              'insert-before', 'insert-after', 'undo', 'redo'],
            after: () => {
              vditor.setValue(data.md || '');
              setVd(vditor);
            }
          });
        }, 100);
      }
      if (modalName === 'drawio') {
        setXml(data.xml);
      }
      const visible = {...modalVisible};
      visible[modalName] = true;
      setModalVisible(visible);
      props.session.stopKeyMonitor('block-modal');
    });
    props.pluginManager.on('status', forceUpdate);
    props.session.document.store.events.on('saved', forceUpdate);
    props.session.document.store.events.on('unsaved', forceUpdate);
  }, []);
  const toolbarConfig: Partial<IToolbarConfig> = {
    excludeKeys: ['group-video', 'divider', 'fullScreen', 'emotion', 'group-justify', 'group-indent']
  };
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...',
    MENU_CONF: {
      uploadImage: {
        async customUpload(file: File, insertFn: InsertFnType) {  // TS 语法
          uploadImage(file, props.session.clientStore.getClientSetting('curDocId'), props.session.serverConfig.imgur).then((res) => {
            const {url, alt, href} = res.data[0];
            insertFn(url, alt, href);
          });
        }
      }
    }
  };
  useEffect(() => {
    return () => {
      if (editor == null) {
        return;
      }
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);
  return (
    <Layout style={{height: '100%', width: '100%'}}>
      <FileInput
        ref={props.session.fileInputRef}
        onLoad={async (path, filename, contents) => {
          const mimetype = mimetypeLookup(filename);
          if (!mimetype) {
            notification.error({message: '导入失败', description: '不支持的文件格式', placement: 'bottomRight'});
            props.session.showMessage('Invalid filetype!', {warning: true, time: 0 });
            return;
          }
          if (await props.session.importContent(contents, mimetype, path)) {
            props.session.showMessage('导入成功', {text_class: 'success'});
          } else {
            props.session.showMessage('Import failed due to parsing issue', {text_class: 'error'});
          }
        }}
        onError={(error) => {
          logger.error('Data file input error', error);
          props.session.showMessage(`Error reading data: ${error}`, {text_class: 'error'});
        }}
      />
      <Modal
        open={modalVisible.loading}
        footer={null}
        maskClosable={false}
        keyboard={false}
        closeIcon={false}
      >
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <Spin style={{paddingBottom: '20px'}} />
          <div>
            执行中...暂时无法进行其他操作
          </div>
        </div>
      </Modal>
      <Modal
        className={'form_modal'}
        open={modalVisible.subscriptionInfo}
        footer={null}
        onCancel={() => {
          setModalVisible({...modalVisible, subscriptionInfo: false});
          props.session.startKeyMonitor();
        }}>
        <SubscriptionInfoComponent session={props.session} onFinish={() => {
          setModalVisible({...modalVisible, subscriptionInfo: false});
          props.session.startKeyMonitor();
          props.session.showMessage('创建成功');
        }} />
      </Modal>
      <Modal
        style={{width: '500px'}}
        title='导出'
        open={modalVisible.export}
        footer={null}
        onCancel={() => {
          setModalVisible({...modalVisible, export: false});
          props.session.startKeyMonitor();
        }}
      >
        <ExportComponent session={props.session} />
      </Modal>
      <Modal
        className={'form_modal'}
        open={modalVisible.noteInfo}
        footer={null}
        onCancel={() => {
          setModalVisible({...modalVisible, noteInfo: false});
          props.session.startKeyMonitor();
        }}
      >
        <FileBaseInfoComponent
          docInfo={curDocInfo}
          session={props.session}
          tags={props.session.userDocs.flatMap(doc => JSON.parse(doc.tag || '[]') as Array<string>)}
          onFinish={(docId) => {
            setModalVisible({...modalVisible, noteInfo: false});
            props.session.startKeyMonitor();
            navigate(`/note/${docId}`);
          }}
        />
      </Modal>
      <Modal
        width={window.innerWidth - 250}
        open={modalVisible.rtf}
        onCancel={() => {
          setModalVisible({...modalVisible, rtf: false});
          props.session.startKeyMonitor();
        }}
        title='编辑富文本'
        cancelText={'取消'}
        okText={'确认'}
        onOk={() => {
          setModalVisible({...modalVisible, rtf: false});
          props.session.startKeyMonitor();
          props.session.wangEditorOnSave(html);
        }}
      >
        <Toolbar
          editor={editor}
          defaultConfig={toolbarConfig}
          mode='default'
          style={{ borderBottom: '1px solid #ccc' }}
        />
        <Editor
          defaultConfig={editorConfig}
          value={html}
          onCreated={setEditor}
          onChange={editor1 => setHtml(editor1.getHtml())}
          mode='default'
          style={{ height: window.innerHeight - 400, overflowY: 'hidden' }}
        />
      </Modal>
      <Modal
          width={window.innerWidth - 250}
          open={modalVisible.md}
          onCancel={() => {
            setModalVisible({...modalVisible, md: false});
            props.session.startKeyMonitor();
          }}
          title='编辑markdown'
          cancelText={'取消'}
          okText={'确认'}
          onOk={() => {
            setModalVisible({...modalVisible, md: false});
            props.session.startKeyMonitor();
            props.session.mdEditorOnSave(vd?.getValue(), vd?.getHTML().replace(/<p>|<\/p>|\n/g, ''));
          }}
      >
        <div id='vditor' className='vditor' />
      </Modal>
      <Modal width={window.innerWidth - 10}
             style={{top: 20}}
             footer={null}
             title='编辑流程图'
             open={modalVisible.drawio}
             onCancel={() => {
              setModalVisible({...modalVisible, drawio: false});
              props.session.startKeyMonitor();
            }}>
        <DrawioEditor session={props.session} xml={xml} onFinish={() => {
          setModalVisible({...modalVisible, drawio: false});
          props.session.startKeyMonitor();
        }} ref={props.session.drawioRef}/>
      </Modal>
      {/*<Modal*/}
      {/*      className={'form_modal'}*/}
      {/*      open={modalVisible.ocr}*/}
      {/*       title='文本识别'*/}
      {/*       footer={null}*/}
      {/*       onCancel={() => {*/}
      {/*         setModalVisible({...modalVisible, ocr: false});*/}
      {/*         props.session.startKeyMonitor();*/}
      {/*       }}>*/}
      {/*  <ImageOcr session={props.session} onFinish={() => {*/}
      {/*    setModalVisible({...modalVisible, ocr: false});*/}
      {/*    props.session.startKeyMonitor();*/}
      {/*  }}></ImageOcr>*/}
      {/*</Modal>*/}
      {
        showHeader &&
        <Header className='layout-header' style={{
          ...getStyles(props.session.clientStore, ['theme-bg-primary', 'theme-text-primary'])
        }}>
          <img className='logo' src={'/images/icon.png'}></img>
          <div className='header-title'>Effect</div>
          <Menu style={{borderBottom: 'unset'}} className='header-menu' mode='horizontal'
                items={HeaderItems}
                selectedKeys={[curPage]}
                onClick={(e) => {
                  setCurPage(e.key);
                  props.session.clientStore.setClientSetting('curView', e.key);
                  if (e.key === 'note') {
                    props.session.startKeyMonitor();
                    const docId = props.session.clientStore.getClientSetting('curDocId');
                    navigate(`/${e.key}/${docId}`);
                  } else if (e.key === 'test') {
                    navigate(`/${e.key}`);
                  } else {
                    // props.session.stopKeyMonitor('header');
                    const lastSearch = props.session.clientStore.getClientSetting('curSearch');
                    const lastSearchResult = props.session.clientStore.getClientSetting('curSearchResult');
                    if (lastSearch) {
                      if (lastSearchResult) {
                        navigate(`/${e.key}?q=${encodeURIComponent(lastSearch)}&v=${encodeURIComponent(lastSearchResult)}`);
                      } else {
                        navigate(`/${e.key}?q=${encodeURIComponent(lastSearch)}`);
                      }
                    } else if (lastSearchResult) {
                      navigate(`/${e.key}?v=${encodeURIComponent(lastSearchResult)}`);
                    } else {
                      navigate(`/${e.key}`);
                    }
                  }
                }}/>
          {
            curPage === 'note' &&
            <Button onClick={() => {
              const activeWorkSpace = serverConfig.workspaces?.filter(w => w.active);
              if (activeWorkSpace && activeWorkSpace.length > 0 && activeWorkSpace[0].gitLocalDir === '未配置') {
                props.session.showMessage('新建笔记前，请先设置工作空间', {time: 0.5});
                setTimeout(() => {
                  setActiveSetting('2');
                  setSettingOpen(true);
                  props.session.stopKeyMonitor('setting');
                }, 600);
              } else {
                setCurDocInfo({});
                setModalVisible({...modalVisible, noteInfo: true});
                props.session.stopKeyMonitor('create-note');
              }
            }}>新建笔记</Button>
          }
          {
            curPage === 'discovery' &&
              <Button onClick={() => {
                setModalVisible({...modalVisible, subscriptionInfo: true});
              }}>添加订阅</Button>
          }
          <SettingOutlined className='header-setting' onClick={() => {
            setSettingOpen(true);
            props.session.stopKeyMonitor('setting');
          }} />
        </Header>
      }
      <Content style={{height: '100%', width: '100%', borderTop: '2px solid',
        borderTopColor: props.session.clientStore.getClientSetting('theme-bg-secondary'),
        ...getStyles(props.session.clientStore, ['theme-bg-primary', 'theme-text-primary'])
      }}>
        {
          !refreshing &&
            <Outlet/>
        }
      </Content>
      <Drawer drawerStyle={{
        ...getStyles(props.session.clientStore, ['theme-bg-primary', 'theme-text-primary'])
        }} width={drawerWidth} placement='right' open={settingOpen} closable={false} onClose={() => {
        setSettingOpen(false);
        props.session.startKeyMonitor();
      }} >
        <div style={{display: 'flex', height: '100%'}}>
          <DraggableCore key='drawer_drag' onDrag={(_, ui) => {
            setDrawerWidth(Math.min(Math.max(drawerWidth - ui.deltaX, 200), window.innerWidth - 50));
          }}>
            <div className='horizontal-drag' style={{
              ...getStyles(props.session.clientStore, ['theme-bg-secondary'])
            }}></div>
          </DraggableCore>
          <Tabs style={{
            marginLeft: '1em',
            flexGrow: 1,
            ...getStyles(props.session.clientStore, ['theme-bg-primary', 'theme-text-primary'])
          }}
                type='card'
                activeKey={activeSetting}
                onChange={(newActiveSetting) => {
                  setActiveSetting(newActiveSetting);
                }}>
            <Tabs.TabPane tab='外观' key='1'>
              <AppearanceSettingsComponent session={props.session} serverConfig={serverConfig}/>
            </Tabs.TabPane>
            <Tabs.TabPane tab='工作空间' key='2'>
              <WorkspaceSettingsComponent session={props.session} serverConfig={serverConfig}/>
            </Tabs.TabPane>
            <Tabs.TabPane tab='订阅源' key='3'>
              <SubscriptionSettingsComponent session={props.session}/>
            </Tabs.TabPane>
            <Tabs.TabPane tab='图床' key='4'>
              <ImgurComponent session={props.session} serverConfig={serverConfig}/>
            </Tabs.TabPane>
            <Tabs.TabPane tab='全局标签' key='5'>
              <LoomApp
                session={props.session}
                path={Path.root()}
                title={' '}
                collapse={false}
                isMarkdownView={false}
                store={store}
                forSetting={true}
                loomState={serverConfig.tagConfig || defaultTagConfig}
                onSaveState={async (
                  appId: string,
                  state: LoomState,
                  shouldSaveFrontmatter: boolean) => {
                  console.log('saveLoomState', appId, state, shouldSaveFrontmatter);
                  saveServerConfig({...serverConfig, tagConfig: state}).then(() => {
                    props.session.serverConfig.tagConfig = state;
                  });
                }}
              />
            </Tabs.TabPane>
          </Tabs>
        </div>
      </Drawer>
      {/*<Footer className='layout-footer' style={{*/}
      {/*  ...getStyles(props.session.clientStore, ['theme-bg-primary'])*/}
      {/*}}>Footer</Footer>*/}
    </Layout >);
};

export default LayoutComponent;


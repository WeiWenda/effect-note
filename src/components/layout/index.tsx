import * as React from 'react';
import {Layout, Menu, Avatar, Switch, Drawer, Button, Tabs, Modal} from 'antd';
import { SettingOutlined } from '@ant-design/icons';

import '@wangeditor/editor/dist/css/style.css';
import 'vditor/dist/index.css';
import {getStyles} from '../../share/ts/themes';
import {api_utils, DocInfo, Session} from '../../share';
import {useEffect, useState} from 'react';
import {ImageOcr} from '../ImageOcr';
import Config from '../../share/ts/config';
import SimpleSettingsComponent from '../simpleSettings';
import FileBaseInfoComponent from '../fileBaseInfo';
import {PluginsManager} from '../../ts/plugins';
import {Mindmap} from '../mindmap';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import {DrawioEditor} from '../drawioEditor';
import {API_BASE_URL, getServerConfig} from '../../share/ts/utils/APIUtils';
import Vditor from 'vditor';
import {mimetypeLookup} from '../../ts/util';
import logger from '../../ts/logger';
import FileInput from '../fileInput';
import { ExportComponent } from '../export';
import YinComponent from '../yin';
import {YangComponent} from '../yang';
import {SubscriptionInfoComponent} from '../subscriptionInfo';
const { Header, Footer, Sider, Content } = Layout;

export const HeaderItems = [
  { label: 'Notes', key: 'user_view'},
  { label: 'Discovery', key: 'search_view' }, // 菜单项务必填写 key
];
function LayoutComponent(props: {session: Session, config: Config, pluginManager: PluginsManager}) {
  const [settingOpen, setSettingOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [curDocId, setCurDocId] = useState(props.session.clientStore.getClientSetting('curDocId'));
  const [baseInfoModalVisible, setBaseInfoModalVisible] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [curPage, setCurPage] = useState(props.session.clientStore.getClientSetting('curView'));
  const [curDocInfo, setCurDocInfo] = useState({});
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [html, setHtml] = useState('<p>');
  const [vd, setVd] = React.useState<Vditor>();
  useEffect(() => {
    if (!props.session.mdEditorModalVisible) {
      return;
    }
    const vditor = new Vditor('vditor', {
      upload: {
        url: API_BASE_URL +  '/upload_image',
        fieldName: 'wangeditor-uploaded-image',
        accept: 'image/*',
        format: (_files, responseText) => {
          const succMap: any = {};
          JSON.parse(responseText).data.forEach((file: any) => {
            succMap[file.alt] = file.href;
          });
          const res = JSON.stringify({
            'msg': '',
            'code': 0,
            'data': {
              succMap
            }
          });
          return res;
        }
      },
      preview: {
        theme : {
          current: props.session.clientStore.getClientSetting('blackMode') ? 'dark' : 'light',
          path: 'content-theme'
      }},
      theme: props.session.clientStore.getClientSetting('blackMode') ? 'dark' : 'classic',
      height: window.innerHeight - 360,
      toolbar: ['quote', '|', 'headings', 'bold', 'italic', 'strike', 'inline-code', '|',
        'list', 'ordered-list', 'check' , '|', 'link', 'upload', 'table', 'code', '|', 'insert-before', 'insert-after', 'undo', 'redo'],
      after: () => {
        vditor.setValue(props.session.md || '');
        setVd(vditor);
      }
    });
  }, [props.session.mdEditorModalVisible]);
  useEffect(() => {
    setHtml(props.session.wangEditorHtml);
  }, [props.session.wangEditorHtml]);
  const refreshUserDocs = async (openDocId: number) => {
    const newUserDocs = await api_utils.getCurrentUserDocs();
    props.session.userDocs = newUserDocs.content;
    setCurDocId(openDocId);
  };
  useEffect(() => {
    if (baseInfoModalVisible || props.session.pngModalVisible
      || props.session.wangEditorModalVisible || props.session.ocrModalVisible
      || props.session.drawioModalVisible || props.session.mdEditorModalVisible
      || props.session.exportModalVisible) {
      props.session.stopMonitor = true;
    } else {
      props.session.stopMonitor = false;
    }
  }, [baseInfoModalVisible, props.session.pngModalVisible,
    props.session.wangEditorModalVisible, props.session.ocrModalVisible,
    props.session.mdEditorModalVisible, props.session.drawioModalVisible,
    props.session.exportModalVisible]);
  useEffect(() => {
    if (curPage === 'user_view') {
      props.session.stopMonitor = false;
    } else {
      props.session.stopMonitor = true;
    }
  }, [curPage]);
  const toolbarConfig: Partial<IToolbarConfig> = {
    excludeKeys: ['group-video', 'divider', 'fullScreen', 'emotion', 'group-justify', 'group-indent']
  };
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...',
    MENU_CONF: {
      uploadImage: {
        server: API_BASE_URL + '/upload_image',
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
            props.session.showMessage('Invalid filetype!', { time: 0 });
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
        className={'form_modal'}
        open={subscriptionModalVisible}
        footer={null}
        onCancel={() => {
          setSubscriptionModalVisible(false);
        }}>
        <SubscriptionInfoComponent session={props.session} onFinish={() => {
          setSubscriptionModalVisible(false);
          props.session.showMessage('创建成功');
        }} />
      </Modal>
      <Modal
        style={{width: '500px'}}
        title='导出'
        open={props.session.exportModalVisible}
        footer={null}
        onCancel={() => {
          props.session.exportModalVisible = false;
          props.session.emit('updateAnyway');
        }}
      >
        <ExportComponent session={props.session} />
      </Modal>
      <Modal
        className={'form_modal'}
        open={baseInfoModalVisible}
        footer={null}
        onCancel={() => {
          setBaseInfoModalVisible(false);
        }}
      >
        <FileBaseInfoComponent
          docInfo={curDocInfo}
          session={props.session}
          tags={props.session.userDocs.flatMap(doc => JSON.parse(doc.tag || '[]') as Array<string>)}
          onFinish={(docId) => {
            refreshUserDocs(docId).then(() => {
              setBaseInfoModalVisible(false);
              props.session.showMessage('创建成功');
            });
          }}
        />
      </Modal>
      <Modal
        width={window.innerWidth - 250}
        open={props.session.wangEditorModalVisible}
        onCancel={() => {
          props.session.wangEditorModalVisible = false;
          props.session.emit('updateAnyway');
        }}
        title='编辑富文本'
        cancelText={'取消'}
        okText={'确认'}
        onOk={() => {
           props.session.wangEditorModalVisible = false;
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
          open={props.session.mdEditorModalVisible}
          onCancel={() => {
              props.session.mdEditorModalVisible = false;
              props.session.emit('updateAnyway');
          }}
          title='编辑markdown'
          cancelText={'取消'}
          okText={'确认'}
          onOk={() => {
              props.session.mdEditorModalVisible = false;
              props.session.mdEditorOnSave(vd?.getValue(), vd?.getHTML().replace(/<p>|<\/p>|\n/g, ''));
          }}
      >
        <div id='vditor' className='vditor' />
      </Modal>
      <Modal width={window.innerWidth - 10}
             style={{top: 20}}
             title='编辑思维导图'
             open={props.session.pngModalVisible}
             cancelText={'取消'}
             okText={'保存'}
             onOk={() => {
               props.session.mindMapRef.current.getContent().then((data: {img_src: any, json: any}) => {
                 props.session.pngModalVisible = false;
                 props.session.pngOnSave(data.img_src, data.json);
               });
             }} onCancel={() => {
                props.session.pngModalVisible = false;
                props.session.emit('updateAnyway');
             }}>
          <Mindmap ref={props.session.mindMapRef}/>
      </Modal>
      <Modal width={window.innerWidth - 10}
             style={{top: 20}}
             footer={null}
             title='编辑流程图'
             open={props.session.drawioModalVisible}
             onOk={() => {}} onCancel={() => {
        props.session.drawioModalVisible = false;
        props.session.emit('updateAnyway');
      }}>
        <DrawioEditor session={props.session} ref={props.session.drawioRef}/>
      </Modal>
      <Modal
            className={'form_modal'}
            open={props.session.ocrModalVisible}
             title='文本识别'
             footer={null}
             onCancel={() => {
               props.session.ocrModalVisible = false;
               props.session.emit('updateAnyway');
             }}>
        <ImageOcr session={props.session}></ImageOcr>
      </Modal>
      {
        props.session.showHeader &&
        <Header className='layout-header' style={{
          ...getStyles(props.session.clientStore, ['theme-bg-primary', 'theme-text-primary'])
        }}>
          <img className='logo' src={'images/icon.png'}></img>
          <div className='header-title'>Effect</div>
          <Menu style={{borderBottom: 'unset'}} className='header-menu' mode='horizontal'
                items={HeaderItems}
                selectedKeys={[curPage]}
                onClick={(e) => {
                  props.session.clientStore.setClientSetting('curView', e.key);
                  setCurPage(e.key);
                }}/>
          {
            curPage === 'user_view' &&
            <Button onClick={() => {
                getServerConfig().then(serverConfig => {
                    if ([serverConfig.gitLocalDir, serverConfig.gitUsername, serverConfig.gitPassword].includes('未配置')) {
                        props.session.showMessage('新建笔记前，请正确填写git配置');
                    } else {
                      setCurDocInfo({});
                      setBaseInfoModalVisible(true);
                    }
                }).catch(() => {
                  setCurDocInfo({});
                  setBaseInfoModalVisible(true);
                });
            }}>新建笔记</Button>
          }
          {
            curPage === 'search_view' &&
              <Button onClick={() => {
                setSubscriptionModalVisible(true);
              }}>添加订阅</Button>
          }
          <SettingOutlined className='header-setting' onClick={() => {
            setSettingOpen(true);
            props.session.stopMonitor = true;
          }} />
        </Header>
      }
      <Content style={{height: '100%', width: '100%', borderTop: '2px solid',
        borderTopColor: props.session.clientStore.getClientSetting('theme-bg-secondary'),
        ...getStyles(props.session.clientStore, ['theme-bg-primary', 'theme-text-primary'])
      }}>
        {
          !refreshing && curPage === 'user_view' &&
          <YinComponent session={props.session}
                             pluginManager={props.pluginManager}
            curDocId={curDocId} onEditBaseInfo={(docInfo: DocInfo) => {
            setCurDocInfo(docInfo);
            setBaseInfoModalVisible(true);
          }} />
        }
        {
          !refreshing && curPage === 'search_view' &&
          <YangComponent session={props.session} config={props.config}/>
        }
      </Content>
      <Drawer drawerStyle={{
        ...getStyles(props.session.clientStore, ['theme-bg-primary', 'theme-text-primary'])
        }} width='unset' placement='right' open={settingOpen} closable={false} onClose={() => {
        setSettingOpen(false);
        props.session.stopMonitor = false;
      }} >
        <Tabs style={{
          ...getStyles(props.session.clientStore, ['theme-bg-primary', 'theme-text-primary'])
        }} defaultActiveKey='1'>
          <Tabs.TabPane tab='基本配置' key='1'>
            <SimpleSettingsComponent session={props.session} config={props.config} refreshFunc={() => {
              setRefreshing(true);
              setTimeout(() => {
                setRefreshing(false);
              }, 100);
            }}/>
          </Tabs.TabPane>
          {/*<Tabs.TabPane tab='高级配置' key='2'>*/}
          {/*  <div style={{width: '1100px'}}>*/}
          {/*    <SettingsComponent*/}
          {/*      session={props.session}*/}
          {/*      config={props.config}*/}
          {/*      rerenderAll={() => {*/}
          {/*        setRefreshing(true);*/}
          {/*        setTimeout(() => {*/}
          {/*          setRefreshing(false);*/}
          {/*        }, 100);*/}
          {/*      }}*/}
          {/*      onExport={() => {}}*/}
          {/*    />*/}
          {/*  </div>*/}
          {/*</Tabs.TabPane>*/}
        </Tabs>
      </Drawer>
      {/*<Footer className='layout-footer' style={{*/}
      {/*  ...getStyles(props.session.clientStore, ['theme-bg-primary'])*/}
      {/*}}>Footer</Footer>*/}
    </Layout >);
};

export default LayoutComponent;


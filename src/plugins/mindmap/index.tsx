import * as React from 'react'; // tslint:disable-line no-unused-variable
import {PluginApi, registerPlugin} from '../../ts/plugins';
import {linksPluginName} from '../links';
import {ExclamationCircleOutlined, PictureOutlined} from '@ant-design/icons';
import {Document, KityMinderNode, Row, SerializedBlock, Session} from '../../share';
import {Logger} from '../../ts/logger';
import {Dropdown, Image, Menu, MenuProps, message, Modal, Tag} from 'antd';
import {getStyles} from '../../share/ts/themes';
import {Mindmap} from '../../components/mindmap';

export class MindMapPlugin {
  private api: PluginApi;
  private logger: Logger;
  private session: Session;
  private document: Document;

  constructor(api: PluginApi) {
    this.api = api;
    this.logger = this.api.logger;
    this.session = this.api.session;
    this.document = this.api.session.document;
    // NOTE: this may not be initialized correctly at first
    // this only affects rendering @taglinks for now
  }

  public async enable() {

    this.api.registerListener('session', 'insert-mindmap',  (row: Row) => {
      this.session.stopKeyMonitor('mindmap-edit');
      Modal.confirm({
        afterClose: () => {
          this.session.startKeyMonitor();
        },
        onOk: () => {
          this.session.mindMapRef.current.getContent().then((data: {img_src: any, json: any}) => {
            this.session.startKeyMonitor();
            this.session.emitAsync('setMindmap', row, data.img_src, data.json).then(() => {
              this.session.emit('updateAnyway');
            });
          });
        },
        onCancel: () => {
          this.session.startKeyMonitor();
        },
        icon: null,
        width: window.innerWidth - 10,
        style: {top: 20},
        maskClosable: true,
        title: '编辑思维导图',
        cancelText: '取消',
        okText: '保存',
        content: (
          <Mindmap ref={this.session.mindMapRef}/>
        )
      });
    });
    this.api.registerHook('session', 'renderAfterLine', (elements, {path, line, pluginData}) => {
      if (pluginData.links?.png != null) {
        const pngOnClick: MenuProps['onClick'] = ({ key }) => {
          switch (key) {
            case 'del_png':
              Modal.confirm({
                title: '确认删除当前思维导图？',
                icon: <ExclamationCircleOutlined />,
                okText: '确认',
                cancelText: '取消',
                onOk: () => {
                  this.session.emitAsync('unsetMindmap', path.row).then(() => {
                    this.session.emit('updateAnyway');
                  });
                }
              });
              break;
            case 'parse_png':
              const kityNode = pluginData.links.png.json as KityMinderNode;
              const serializedBlock = this.session.fromKityMinderNode(kityNode) as {
                text: string,
                collapsed?: boolean,
                id?: Row,
                plugins?: any,
                children?: Array<SerializedBlock>
              };
              this.session.document.setLine(path.row, serializedBlock.text.split(''));
              this.session.document.getInfo(path.row).then(rowInfo => {
                this.session.delBlocks(path.row, 0, rowInfo.childRows.length).then(() => {
                  this.session.addBlocks(path, 0, serializedBlock.children || []).then(() => {
                    this.session.emit('updateInner');
                  });
                });
              });
              break;
            case 'edit_png':
              this.session.stopKeyMonitor('mindmap-edit');
              Modal.confirm({
                afterClose: () => {
                  this.session.startKeyMonitor();
                },
                onOk: () => {
                  this.session.mindMapRef.current.getContent().then((data: {img_src: any, json: any}) => {
                    this.session.startKeyMonitor();
                    this.session.emitAsync('setMindmap', path.row, data.img_src, data.json).then(() => {
                      this.session.emit('updateAnyway');
                    });
                  });
                },
                onCancel: () => {
                  this.session.startKeyMonitor();
                },
                icon: null,
                width: window.innerWidth - 10,
                style: {top: 20},
                maskClosable: true,
                title: '编辑思维导图',
                cancelText: '取消',
                okText: '保存',
                content: (
                  <Mindmap ref={this.session.mindMapRef}/>
                )
              });
              setTimeout(() => {
                if (this.session.mindMapRef.current) {
                  this.session.mindMapRef.current.setContent(pluginData.links.png.json);
                }
              }, 1000);
              break;
            default:
              message.info(`Click on item ${key}`);
          }
        };
        const pngMenu = <Menu
          onClick={pngOnClick}
          items={[{
            key: 'edit_png',
            label: '修改思维导图'
          },
            {
              key: 'parse_png',
              label: '更新大纲内容',
            },
            {
              key: 'del_png',
              label: '删除思维导图',
            }]}
        ></Menu>;
        elements.push(
          <Dropdown key='mindmap-icon' overlay={pngMenu} trigger={['contextMenu']} >
            <Tag icon={<PictureOutlined />}
                 onClick={() => pluginData.links.png.visible = true}
                 style={{
                   marginLeft: '5px',
                   ...getStyles(this.session.clientStore, ['theme-bg-secondary', 'theme-trim', 'theme-text-primary'])
                 }} >
              脑图
            </Tag>
          </Dropdown>,
          <Image
            key='mindmap-preview'
            style={{ display: 'none' }}
            src={pluginData.links.png.src}
            preview={{
              visible: pluginData.links.png.visible,
              src: pluginData.links.png.src,
              onVisibleChange: value => {
                pluginData.links.png.visible = value;
                this.session.emit('updateAnyway');
              }
            }}
          />
        );
      }
      return elements;
    });
  }
}



registerPlugin(
  {
    name: 'MindMap',
    author: 'Jeff Wu',
    description: 'Lets you inline markdown content',
    dependencies: [linksPluginName],
  },
  async (api) => {
    const mindMapPlugin = new MindMapPlugin(api);
    await mindMapPlugin.enable();
    return mindMapPlugin;
  },
  (api => api.deregisterAll()),
);

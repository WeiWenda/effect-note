import * as React from 'react'; // tslint:disable-line no-unused-variable
import {PluginApi, registerPlugin} from '../../ts/plugins';
import {linksPluginName} from '../links';
import {RetweetOutlined} from '@ant-design/icons';
import {Document, KityMinderNode, Row, SerializedBlock, Session} from '../../share';
import {Logger} from '../../ts/logger';
import {Modal, Space, Tooltip} from 'antd';
import {Mindmap} from '../../components/mindmap';
import {SpecialBlock} from '../../share/components/Block/SpecialBlock';

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
        elements.push(
          <SpecialBlock key={'special-block'}
                        path={path}
                        title={line.join('')}
                        collapse={pluginData.links.collapse || false}
                        blockType={'Drawio'} session={this.session} tools={
            <Space>
              <Tooltip title={'将思维导图的内容更新到子节点中'}>
                <RetweetOutlined onClick={() => {
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
                        this.session.showMessage('更新完成！');
                        this.session.emit('updateInner');
                      });
                    });
                  });
                }
                }/>
              </Tooltip>
            </Space>
          }>
            <img
              onClick={() => {
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
              }}
              src={pluginData.links.png.src.startsWith('<svg ') ? `data:image/svg+xml;utf8,${encodeURIComponent(pluginData.links.png.src)}` : pluginData.links.png.src}
            />
          </SpecialBlock>
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

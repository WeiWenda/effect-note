import * as React from 'react'; // tslint:disable-line no-unused-variable
import {PluginApi, registerPlugin} from '../../ts/plugins';
import {Document, Mutation, Row, Session} from '../../share';
import {Dropdown, Image, Menu, MenuProps, message, Modal, Popover, Space, Tag } from 'antd';
import {EditOutlined, ExclamationCircleOutlined, PictureOutlined, ZoomInOutlined,
    ZoomOutOutlined, CheckSquareOutlined, BorderOutlined} from '@ant-design/icons';
import {Logger} from '../../ts/logger';
import {getStyles} from '../../share/ts/themes';
import {pluginName as tagsPluginName, TagsPlugin} from '../tags';
import {DrawioViewer} from '../../components/drawioViewer';
import {getTaskStatus, HoverIconDropDownComponent} from './dropdownMenu';
import {MarksPlugin, pluginName} from '../marks';
import {SpecialBlock} from '../../share/components/Block/BlockWithTypeHeader';
import {TaskMenuComponent} from '../tags/taskMenu';
import Moment from 'moment/moment';

export class LinksPlugin {
    public api: PluginApi;
    private logger: Logger;
    private session: Session;
    private document: Document;
    private tagsPlugin: TagsPlugin;
    private markPlugin: MarksPlugin;
    public SetCollapse!: new(row: Row, collpase: boolean) => Mutation;
    constructor(api: PluginApi) {
        this.api = api;
        this.logger = this.api.logger;
        this.session = this.api.session;
        this.document = this.session.document;
        this.tagsPlugin = this.api.getPlugin(tagsPluginName) as TagsPlugin;
        this.markPlugin = this.api.getPlugin(pluginName) as MarksPlugin;
    }
    public async enable() {
        const that = this;
        class SetCollapse extends Mutation {
            private row: Row;
            private collapse: boolean;

            constructor(row: Row, collapse: boolean) {
                super();
                this.row = row;
                this.collapse = collapse;
            }
            public str() {
                return `row ${this.row}, collapse ${this.collapse}`;
            }
            public async mutate(/* session */) {
                await that._setCollapse(this.row, this.collapse);
                await that.api.updatedDataForRender(this.row);
            }
            public async rewind(/* session */) {
                return [
                    new SetCollapse(this.row, !this.collapse),
                ];
            }
        }
        this.SetCollapse = SetCollapse;
        const onCheckChange = (tags: string[], prefix: string, row: number) => {
            const dateString = Moment().format('yyyy-MM-DD HH:mm:ss');
            let filteredTags = tags?.filter(t => !t.startsWith(prefix))
              .filter(t => !['Delay', 'Done', 'Todo', 'Doing'].includes(t)) || [];
            filteredTags = [prefix + dateString,  ...filteredTags];
            const newStatus = getTaskStatus(filteredTags);
            if (newStatus) {
                filteredTags = [newStatus, ...filteredTags];
            }
            return this.tagsPlugin.setTags(row, filteredTags);
        };
        const onInsertDrawio = (row: Row) => {
            that.getXml(row).then(xml => {
                that.session.emit('openModal', 'drawio', {xml: xml});
            });
            that.session.drawioOnSave = (xml: string) => {
                that.setXml(row, xml).then(() => {
                    that.session.emit('updateAnyway');
                });
            };
        };
        this.api.registerListener('session', 'setMindmap', async (row: Row, img_src: string, img_json: string) => {
            await this.setPng(row, img_src, img_json);
        });
        this.api.registerListener('session', 'setDrawio',  (row: Row) => {
            onInsertDrawio(row);
        });
        this.api.registerListener('session', 'setCode', async (row: Row, code: string, language: string) => {
            await this.setCode(row, code, language);
        });
        this.api.registerListener('session', 'setMarkdown', async (row: Row, markdown: string) => {
            await this.setMarkdown(row, markdown);
        });
        this.api.registerListener('session', 'toggleBoard', async (row: Row) => {
            const isBoardNow = await this.getIsBoard(row);
            if (isBoardNow) {
                await this.setIsBoard(row, false);
            } else {
                await this.setIsBoard(row, true);
            }
        });
        this.api.registerListener('session', 'toggleCheck', async (row: Row) => {
            const isCheckNow = await this.getIsCheck(row);
            if (isCheckNow === null) {
                await this.setIsCheck(row, false);
                const tags = await this.tagsPlugin.getTags(row) || [];
                await onCheckChange(tags, 'create: ', row);
            } else {
                await this.unsetIsCheck(row);
            }
        });
        this.api.registerHook('session', 'renderHoverBullet', function(bullet, {path, rowInfo}) {
              return (
                <HoverIconDropDownComponent session={that.session} bullet={bullet} path={path} rowInfo={rowInfo}
                    tagsPlugin={that.tagsPlugin} markPlugin={that.markPlugin} linksPlugin={that} onInsertDrawio={onInsertDrawio} />
              );
          });
        this.api.registerHook('document', 'pluginRowContents', async (obj, { row }) => {
            const is_board = await this.getIsBoard(row);
            const is_check = await this.getIsCheck(row);
            const collapse = await this.getCollapse(row);
            const ids_to_pngs = await this.api.getData('ids_to_pngs', {});
            const png = ids_to_pngs[row] || null;
            const ids_to_xmls = await this.api.getData('ids_to_xmls', {});
            const xml = ids_to_xmls[row] || null;
            const md = await this.getMarkdown(row);
            const code = await this.getCode(row);
            obj.links = { is_board, is_check, collapse, png, xml, md, code};
            return obj;
        });
        this.api.registerHook('document', 'serializeRow', async (struct, info) => {
            const collapse = await this.getCollapse(info.row);
            if (collapse !== null) {
                struct.collapse = collapse;
            }
            const isBoard = await this.getIsBoard(info.row);
            if (isBoard) {
                struct.is_board = isBoard;
            }
            const isCheck = await this.getIsCheck(info.row);
            if (isCheck !== null) {
                struct.is_check = isCheck;
            }
            const ids_to_pngs = await this.api.getData('ids_to_pngs', {});
            if (ids_to_pngs[info.row] != null) {
                struct.png = ids_to_pngs[info.row];
            }
            const ids_to_xmls = await this.api.getData('ids_to_xmls', {});
            if (ids_to_xmls[info.row] != null) {
                struct.drawio = ids_to_xmls[info.row];
            }
            const md = await this.getMarkdown(info.row);
            if (md != null) {
                struct.md = md;
            }
            const code = await this.getCode(info.row);
            if (code != null) {
                struct.code = code;
            }
            return struct;
        });
        this.api.registerListener('document', 'loadRow', async (path, serialized) => {
            if (serialized.collapse) {
                await this._setCollapse(path.row, true);
            }
            if (serialized.is_board) {
                await this._setIsBoard(path.row, true);
            }
            if (serialized.is_check !== undefined) {
                await this._setIsCheck(path.row, serialized.is_check);
            } else {
                const cursorIsCheck = await this.getIsCheck(this.session.cursor.path.row);
                if (cursorIsCheck !== null) {
                    await this._setIsCheck(path.row, false);
                }
            }
            if (serialized.code) {
                await this._setCode(path.row, serialized.code.content, serialized.code.language);
            }
            if (serialized.png?.src && serialized.png?.json) {
                await this._setPng(path.row, serialized.png.src, serialized.png.json);
            }
            if (serialized.drawio) {
                await this._setXml(path.row, serialized.drawio);
            }
            if (serialized.md) {
                await this._setMarkdown(path.row, serialized.md);
            }
            await this.api.updatedDataForRender(path.row);
        });
        async function addStrikeThrough(session: Session, row: Row) {
            await session.addChars(row, -1, ['~', '~']);
            await session.addChars(row, 0, ['~', '~']);
        }

        async function removeStrikeThrough(session: Session, row: Row) {
            await session.delChars(row, -2, 2);
            await session.delChars(row, 0, 2);
        }
        this.api.registerHook('session', 'renderLineContents', (lineContents, info) => {
            const { path, pluginData } = info;
            let tags: string[] = pluginData.tags?.tags || [];
            if (pluginData.links.is_check !== null) {
                lineContents.unshift(<Popover key={'status'}
                         trigger='hover'
                         onOpenChange={(open) => {
                             if (open) {
                                 this.session.cursor.reset();
                                 this.session.stopKeyMonitor('tag-task');
                             } else {
                                 this.session.startKeyMonitor();
                             }
                         }}
                         content={(
                           <TaskMenuComponent tags={tags} setTags={(newTags: string[]) => {
                               this.tagsPlugin.setTags(path.row, newTags).then(() => {
                                   this.session.emit('updateAnyway');
                               });
                           }}/>
                         )}>
                    {
                        pluginData.links.is_check ? <CheckSquareOutlined className={'check-icon'} onClick={() => {
                            this.setIsCheck(path.row, false).then(() => {
                                removeStrikeThrough(this.session, path.row).then(() => {
                                    this.session.emit('updateInner');
                                });
                            });
                        }} /> : <BorderOutlined className={'check-icon'} onClick={() => {
                                    onCheckChange(tags, 'end: ', path.row).then(() => {
                                        this.setIsCheck(path.row, true).then(() => {
                                            addStrikeThrough(this.session, path.row).then(() => {
                                                this.session.emit('updateAnyway');
                                            });
                                        });
                                    });
                        }}/>
                    }
                </Popover>);
            }
            return lineContents;
        });
        this.api.registerHook('session', 'renderAfterLine', (elements, {path, pluginData}) => {
            if (pluginData.links?.xml != null) {
                const ref: any = React.createRef();
                elements.push(
                  <SpecialBlock key={'special-block'}
                                path={path}
                                collapse={pluginData.links.collapse || false}
                                setCollapseCallback={(collapse) => this.setBlockCollapse(path.row, collapse)}
                                blockType={'Drawio'} session={that.session} tools={
                      <Space>
                          <ZoomInOutlined onClick={() => {ref.current!.zoomIn(); }}/>
                          <ZoomOutOutlined onClick={() => {ref.current!.zoomOut(); }}/>
                          <EditOutlined onClick={() => {
                              onInsertDrawio(path.row);
                          }}/>
                      </Space>
                  }>
                      <DrawioViewer ref={ref} key={'drawio'} session={that.session} row={path.row} content={pluginData.links.xml}
                                    onClickFunc={onInsertDrawio}/>
                  </SpecialBlock>
                );
            }
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
                                    that.unsetPng(path.row).then(() => {
                                        that.session.emit('updateAnyway');
                                    });
                                }
                            });
                            break;
                        case 'edit_png':
                            that.session.emit('openModal', 'png');
                            that.session.pngOnSave = (img_src: any, json: any) => {
                                that.setPng(path.row, img_src, json).then(() => {
                                    that.session.emit('updateAnyway');
                                });
                            };
                            setTimeout(() => {
                                that.getPng(path.row).then(kmnode => {
                                    that.session.mindMapRef.current.setContent(kmnode);
                                });
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
                        label: '修改思维导图',
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
                                that.session.emit('updateAnyway');
                            }
                        }}
                    />
                );
            }
            return elements;
        });
    }

    public async setBlockCollapse(row: Row, collapse: boolean) {
        await this.session.do(new this.SetCollapse(row, collapse));
        return null;
    }

    public async clearLinks() {
        await this.api.setData('ids_to_links', {});
        await this.api.setData('ids_to_pngs', {});
        await this.api.setData('ids_to_xmls', {});
        await this.api.setData('ids_to_mds', {});
        await this.api.setData('ids_to_codes', {});
        await this.api.setData('ids_to_collapses', {});
        await this.api.setData('ids_to_board', {});
        await this.api.setData('ids_to_check', {});
    }

    public async getPng(row: Row): Promise<any> {
        const ids_to_pngs = await this.api.getData('ids_to_pngs', {});
        return ids_to_pngs[row].json;
    }
    public async getMarkdown(row: Row): Promise<any> {
        const ids_to_mds = await this.api.getData('ids_to_mds', {});
        if (ids_to_mds[row]) {
            const markdown = await this.api.getData(row + ':md', '');
            return markdown || null;
        } else {
            return null;
        }
    }

    public async setMarkdown(row: Row, md: String): Promise<void> {
        await this._setMarkdown(row, md);
        await this.api.updatedDataForRender(row);
    }

    public async getCode(row: Row): Promise<any> {
        const ids_to_mds = await this.api.getData('ids_to_codes', {});
        if (ids_to_mds[row]) {
            const markdown = await this.api.getData(row + ':code', {});
            return markdown;
        } else {
            return null;
        }
    }

    public async setCode(row: Row, content: string, language: string): Promise<void> {
        await this._setCode(row, content, language);
        await this.api.updatedDataForRender(row);
    }

    private async _setCode(row: Row, content: string, language: string): Promise<void> {
        await this.api.setData(row + ':code', {content, language});
        // 不存在的key查询效率较差
        const ids_to_mds = await this.api.getData('ids_to_codes', {});
        ids_to_mds[row] = 1;
        await this.api.setData('ids_to_codes', ids_to_mds);
    }

    private async _setMarkdown(row: Row, md: String): Promise<void> {
        await this.api.setData(row + ':md', md);
        // 不存在的key查询效率较差
        const ids_to_mds = await this.api.getData('ids_to_mds', {});
        ids_to_mds[row] = 1;
        await this.api.setData('ids_to_mds', ids_to_mds);
    }

    public async getXml(row: Row): Promise<any> {
        const ids_to_xmls = await this.api.getData('ids_to_xmls', {});
        return ids_to_xmls[row];
    }

    public async setXml(row: Row, xml: String): Promise<void> {
        await this._setXml(row, xml);
        await this.api.updatedDataForRender(row);
    }

    private async _setXml(row: Row, xml: String): Promise<void> {
        const ids_to_xmls = await this.api.getData('ids_to_xmls', {});
        ids_to_xmls[row] = xml;
        await this.api.setData('ids_to_xmls', ids_to_xmls);
    }

    public async setPng(row: Row, src: String, json: any): Promise<void> {
        await this._setPng(row, src, json);
        await this.api.updatedDataForRender(row);
    }

    private async _setPng(row: Row, src: String, json: any): Promise<void> {
        const ids_to_pngs = await this.api.getData('ids_to_pngs', {});
        ids_to_pngs[row] = {src: src, json: json};
        await this.api.setData('ids_to_pngs', ids_to_pngs);
    }

    public async unsetPng(row: Row) {
        const ids_to_pngs = await this.api.getData('ids_to_pngs', {});
        delete ids_to_pngs[row];
        await this.api.setData('ids_to_pngs', ids_to_pngs);
        await this.api.updatedDataForRender(row);
    }

    public async getCollapse(row: Row): Promise<boolean | null> {
        const ids_to_collapses = await this.api.getData('ids_to_collapses', {});
        return ids_to_collapses[row] || null;
    }

    private async _setCollapse(row: Row, mark: boolean) {
        const ids_to_collapses = await this.api.getData('ids_to_collapses', {});
        ids_to_collapses[row] = mark;
        await this.api.setData('ids_to_collapses', ids_to_collapses);
    }

    public async getIsCheck(row: Row): Promise<boolean | null> {
        const ids_to_check = await this.api.getData('ids_to_check', {});
        return ids_to_check[row] !== undefined ? ids_to_check[row] : null;
    }
    public async setIsCheck(row: Row, is_board: boolean) {
        await this._setIsCheck(row, is_board);
        await this.api.updatedDataForRender(row);
    }
    public async unsetIsCheck(row: Row) {
        const ids_to_check = await this.api.getData('ids_to_check', {});
        delete ids_to_check[row];
        await this.api.setData('ids_to_check', ids_to_check);
        await this.api.updatedDataForRender(row);
    }

    private async _setIsCheck(row: Row, mark: boolean) {
        const ids_to_check = await this.api.getData('ids_to_check', {});
        ids_to_check[row] = mark;
        await this.api.setData('ids_to_check', ids_to_check);
    }

    public async getIsBoard(row: Row): Promise<boolean | null> {
        const ids_to_board = await this.api.getData('ids_to_board', {});
        return ids_to_board[row] || null;
    }
    public async setIsBoard(row: Row, is_board: boolean) {
        await this._setIsBoard(row, is_board);
        await this.api.updatedDataForRender(row);
    }
    private async _setIsBoard(row: Row, mark: boolean) {
        const ids_to_board = await this.api.getData('ids_to_board', {});
        ids_to_board[row] = mark;
        await this.api.setData('ids_to_board', ids_to_board);
    }
}
export const linksPluginName = 'Links';
registerPlugin<LinksPlugin>(
  {
    name: linksPluginName,
    author: 'WeiWenda',
    description: (
      <div>
       允许每个节点增加一个http外链，用于提供pdf、ppt、wiki。
      </div>
    ),
    dependencies: [tagsPluginName, pluginName],
  },
    async function(api) {
      const linksPlugin = new LinksPlugin(api);
      await linksPlugin.enable();
      return linksPlugin;
  },
  (api => api.deregisterAll()),
);

import {api_utils, DocInfo, Document, IndexedDBBackend, Path, Session, ViewOnlySessionComponent} from '../../share';

import * as React from 'react';
import {useEffect, useState} from 'react';
import type {MenuProps} from 'antd';
import {Collapse, Input, Menu} from 'antd';
import logger from '../../ts/logger';
import {PluginsManager} from '../../ts/plugins';
import {MarksPlugin} from '../../plugins/marks';
import {TagsPlugin} from '../../plugins/tags';
import config from '../../share/ts/vim';
import {getStyles} from '../../share/ts/themes';
import {getDocContent} from '../../share/ts/utils/APIUtils';
import {DraggableCore} from 'react-draggable';
import {LinksPlugin} from '../../plugins/links';
import {SessionWithToolbarComponent} from '../session';
import {mimetypeLookup} from '../../ts/util';

const { Search } = Input;
const { Panel } = Collapse;

type MenuItem = Required<MenuProps>['items'][number];
class TagTree extends Map<string, TagTree | number> {};

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

function getTagMap(filteredDocs: DocInfo[]): TagTree {
  const tagMap: TagTree = new Map();
  tagMap.set('所有笔记', new Map);
  filteredDocs.forEach(doc => {
    let menuLabel = doc.name!;
    if (doc.dirtyUpdate) {
      menuLabel = '* ' + menuLabel;
    }
    (tagMap.get('所有笔记') as TagTree).set(menuLabel, doc.id!);
    const tagList: string[] = [];
    if (doc.tag) {
      const jsonArray =  JSON.parse(doc.tag);
      if (Array.isArray(jsonArray)) {
        jsonArray.map(singleTag => {
          tagList.push((singleTag as string) + '/默认分组');
        });
      }
    }
    tagList.forEach(singleTag => {
      let tagMapTmp: TagTree = tagMap;
      const tags = singleTag.split('/');
      for (let i = 0; i < tags.length; i++) {
        if (!tagMapTmp.has(tags[i])) {
          tagMapTmp.set(tags[i], new Map());
        }
        tagMapTmp = tagMapTmp.get(tags[i]) as TagTree;
      }
      tagMapTmp.set(menuLabel, doc.id!);
    });
  });
  return tagMap;
}

function getItems(
  tagTree: TagTree,
  menuID2DocID: Array<number>
): MenuItem[] {
  const ret: MenuItem[] = [];
  tagTree.forEach((value, key) => {
    if (value instanceof Map) {
      const valueMapKeys = Array.from((value as TagTree).keys());
      const onlyDefault = valueMapKeys.length === 1 && valueMapKeys[0] === '默认分组';
      if (onlyDefault) {
        const oldLength = menuID2DocID.length;
        menuID2DocID.push(-2);
        const childItems = getItems(value.get('默认分组') as TagTree, menuID2DocID);
        ret.push(getItem(key, oldLength, null, childItems));
      } else {
        const oldLength = menuID2DocID.length;
        menuID2DocID.push(-2);
        const childItems = getItems(value, menuID2DocID);
        ret.push(getItem(key, oldLength, null, childItems));
      }
    } else {
      ret.push(getItem(key, menuID2DocID.length));
      menuID2DocID.push(value);
    }
  });
  return ret;
}

async function toggleRecursiveCollapse(document: Document, path: Path, collapse: boolean): Promise<any> {
  logger.debug('Toggle state: ' + collapse + ' row = ' + path.row);
  if (!document.cache.get(path.row)) {
    await document.getInfo(path.row);
  }
  await document.setCollapsed(path.row, collapse);

  if (await document.hasChildren(path.row)) {
    let children = await document.getChildren(path);
    logger.debug('No of children: ' + children.length);
    return Promise.all<any>(children.map((child_path) => {
      return toggleRecursiveCollapse(document, child_path, collapse);
    }));
  } else {
    return Promise.resolve();
  }
}

function YinComponent(props: {session: Session,
  pluginManager: PluginsManager, curDocId: number, onEditBaseInfo: (docInfo: DocInfo) => void}) {
  const [curMenu, setCurMenu] = useState(props.session.clientStore.getClientSetting('openFile'));
  const [fileListWidth, setFileListWidth] = useState(250);
  const [previewWidth, setPreviewWidth] = useState(300);
  const [openKeys, setOpenKeys] = useState<string[]>(JSON.parse(props.session.clientStore.getClientSetting('openMenus')));
  const [filter, setFilter] = useState('');
  const docs = props.session.userDocs;
  const [menuItems, setMenuItems] = useState(new Array<MenuItem>());
  const [menuItem2DocId, setMenuItem2DocId] = useState(new Array<number>());
  const [loading, setLoading] = useState(true);
  const [previewSession, setPreviewSession] = useState<Session | null>(null);
  const [markSession, setMarkSession] =  useState<Session | null>(null);
  const [tagSession, setTagSession] =  useState<Session | null>(null);
  const [curDocId, setCurDocId] = useState(props.curDocId);
  const markPlugin = props.pluginManager.getInfo('Marks').value as MarksPlugin;
  const tagPlugin = props.pluginManager.getInfo('Tags').value as TagsPlugin;
  const linkPlugin = props.pluginManager.getInfo('Links').value as LinksPlugin;

  // 1. 父页面新建笔记时
  // 2. 修改过滤时
  useEffect(() => {
    const getDocContents = async () => {
      const docContents: DocInfo[] = await Promise.all(props.session.userDocs.filter(x => x.id !== undefined && x.id >= 0)
          .map(async (x) => {
        return await getDocContent(x.id!);
      }));
      return docContents;
    };
    const updateMenu = (filteredDocs: DocInfo[]) => {
      const menuID2DocID: Array<number> = [];
      const tagMap = getTagMap(filteredDocs);
      const items = getItems(tagMap, menuID2DocID);
      setMenuItems(items);
      setMenuItem2DocId(menuID2DocID);
    };
    if (filter) {
      props.session.showMessage('检索中...');
      getDocContents().then(docContents => {
        const filteredDocs = docContents.filter(x => {
          const docName = x.name!;
          const docContent = x.content!;
          return docName.includes(filter) || docContent.includes(filter);
        });
        if (filteredDocs.length > 0) {
          updateMenu(filteredDocs);
          props.session.showMessage('检索完成');
        } else {
          props.session.showMessage('未找到匹配内容');
        }
      });
    } else {
      updateMenu(props.session.userDocs);
    }
  }, [filter, props.session.userDocs]);
  const markDirty = (docID: number) => {
    props.session.userDocs = (docs.map(doc => {
      if (doc.id === docID) {
        doc.dirtyUpdate = true;
      }
      return doc;
    }));
  };
  const afterLoadDoc = async () => {
    const docStore = props.session.document.store;
    props.session.reset_history();
    props.session.reset_jump_history();
    const previewDocument = new Document(docStore, '', true);
    const newPreviewSession = new Session(props.session.clientStore, previewDocument, {});
    async function reloadRow(row: number) {
      await previewDocument.getInfo(row, true);
    }
    props.session.document.onEvents(['lineSaved', ], ({row}) => {
      reloadRow(row).then(() => {
        newPreviewSession.emit('updateInner');
      });
    });
    props.session.document.on('loadRow', (path: Path) => {
      reloadRow(path.parent!.row).then(() => {
        newPreviewSession.emit('updateInner');
      });
    });
    props.session.document.on('afterMove', async ({old_parent, new_parent}) => {
      await reloadRow(old_parent);
      await reloadRow(new_parent);
      newPreviewSession.emit('updateInner');
    });
    const refreshMarkSession = () => {
      const markDocument = new Document(docStore, '');
      markPlugin.listMarks().then(marks => {
        markDocument.cache.loadRow(0, {
          line: ''.split(''),
          childRows: Object.values(marks).map(path => path.row),
          collapsed: false,
          parentRows: [],
          pluginData: ''
        });
        Promise.all<any>(Object.entries(marks).map(async mark => {
          const originInfo = await markDocument.getInfo(mark[1].row);
          markDocument.cache.loadRow(mark[1].row, {...originInfo.info, parentRows: [0], collapsed: true});
        })).then(() => {
          setMarkSession(new Session(props.session.clientStore, markDocument, {}));
        });
      });
    };
    props.session.document.on('markChange', () => refreshMarkSession());
    const refreshTagSession = () => {
      const tagDocument = new Document(docStore, '');
      const newTagSession = new Session(props.session.clientStore, tagDocument, {});
      tagPlugin.listTags().then(tags => {
        console.log('tags', tags);
        const childRows: number[] = [];
        const loadTagPromises = Object.entries(tags).reduce((p: Promise<void>, tag) =>
          p.then(() =>
              // 修改标签block
              docStore.getNew().then(newRow => {
                childRows.push(newRow);
                tagDocument.cache.loadRow(newRow, {
                  line: tag[0].split(''),
                  childRows: tag[1].map(path => path.row),
                  collapsed: false,
                  parentRows: [0],
                  pluginData: ''
                });
                // 修改节点parent
                return tag[1].reduce((p2, tagPath) =>
                  p2.then(() =>
                    tagDocument.getInfo(tagPath.row).then(originInfo => {
                      tagDocument.cache.loadRow(tagPath.row,
                        {...originInfo.info, parentRows: [newRow].concat(originInfo.parentRows), collapsed: true});
                    })
                  ), Promise.resolve());
              })
          ), Promise.resolve());
        loadTagPromises.then(() => {
          tagDocument.cache.loadRow(0, {
            line: ''.split(''),
            childRows,
            collapsed: false,
            parentRows: [],
            pluginData: ''
          });
          setTagSession(newTagSession);
        });
      });
    };
    props.session.document.on('tagChange', () => refreshTagSession());
    setPreviewSession(null);
    setMarkSession(null);
    setTagSession(null);
    await props.session.document.fullLoadTree(Path.rootRow());
    toggleRecursiveCollapse(previewDocument, Path.root(), true).then(() => {
      setPreviewSession(newPreviewSession);
    });
    refreshMarkSession();
    refreshTagSession();
  };
  const beforeLoadDoc = async () => {
    props.session.document.root = Path.root();
    props.session.cursor.reset();
    props.session.document.cache.clear();
    props.session.stopAnchor();
    props.session.search = null;
  };
  const loadDoc = async (docID: number) => {
    setLoading(true);
    const curDocInfo = docs.find(doc => doc.id === docID)!;
    let initialLoad = false;
    if (!curDocInfo.loaded) {
      initialLoad = true;
      // props.session.showMessage('初始加载中...');
      curDocInfo.loaded = true;
    } else {
      // props.session.showMessage('加载中...');
    }
    let docContent: any;
    if (docID === -1) {
      docContent = config.getDefaultData();
    } else {
      const docRes = await api_utils.getDocContent(docID);
      docContent = docRes.content;
    }
    const newDocName = docID.toString();
    localStorage.setItem('currentDocId', newDocName);
    document.title = curDocInfo.name!;
    // const docStore = new DocumentStore(new InMemory());
    props.session.document.store.setBackend(new IndexedDBBackend(newDocName), newDocName);
    await beforeLoadDoc();
    props.session.document.removeAllListeners('lineSaved');
    props.session.document.removeAllListeners('beforeMove');
    props.session.document.removeAllListeners('beforeAttach');
    props.session.document.removeAllListeners('beforeDetach');

    if (initialLoad) {
      await markPlugin.clearMarks();
      await tagPlugin.clearTags();
      await linkPlugin.clearLinks();
      await props.session.reloadContent(docContent, mimetypeLookup(curDocInfo.filename!)).then(() => {
        props.session.document.onEvents(['lineSaved', 'beforeMove', 'beforeAttach', 'beforeDetach'], () => markDirty(docID));
        return afterLoadDoc();
      });
      setLoading(false);
    } else {
      props.session.document.onEvents(['lineSaved', 'beforeMove', 'beforeAttach', 'beforeDetach'], () => markDirty(docID));
      await afterLoadDoc();
      setLoading(false);
    }
  };
  useEffect(() => {
    console.log(`当前文档id: ${props.curDocId}`);
    setCurDocId(props.curDocId);
    // 父页面新建笔记时
    if (props.session.userDocs.find(doc => doc.id === props.curDocId) || props.curDocId === -1) {
      loadDoc(props.curDocId);
    }
  }, [props.curDocId]);
  const onClick: MenuProps['onClick'] = e => {
    if (!loading) {
      setCurMenu(e.key);
      props.session.clientStore.setClientSetting('openFile', e.key);
      const remoteDocId = menuItem2DocId[Number(e.key)];
      setCurDocId(remoteDocId);
      loadDoc(remoteDocId);
    } else {
      props.session.showMessage('正在加载，请勿离开');
    }
  };
  const onOpenChange: MenuProps['onOpenChange'] = keys => {
    const filteredKeys = keys.filter(key => menuItem2DocId.length > Number(key) && menuItem2DocId[Number(key)] === -2);
    props.session.clientStore.setClientSetting('openMenus', JSON.stringify(filteredKeys));
    setOpenKeys(filteredKeys);
  };
  const onSearchFileList = (e: string) => {
    setFilter(e);
  };
  return (
    <div style={{height: '100%', flexDirection: 'row', display: 'flex', width: '100%'}}>
      {
        props.session.showFilelist &&
          <div style={{width: `${fileListWidth}px`, overflow: 'auto', flexShrink: 0}}>
              <Search
                  placeholder='搜索笔记名称或内容'
                  allowClear
                  onSearch={onSearchFileList}
                  onPressEnter={(e: any) => {onSearchFileList(e.target.value); }}
                  onFocus={() => {props.session.stopMonitor = true; } }
                  onBlur={() => {props.session.stopMonitor = false; } }/>
              <Menu
                  onClick={onClick}
                  selectedKeys={[curMenu]}
                  onOpenChange={onOpenChange}
                  openKeys={openKeys}
                  mode='inline'
                  items={menuItems}
              />
          </div>
      }
      {
        props.session.showFilelist &&
          <DraggableCore key='filelist_drag' onDrag={(_, ui) => {
            setFileListWidth(Math.min(Math.max(fileListWidth + ui.deltaX, 72), 700));
          }}>
              <div className='horizontal-drag' style={{
                ...getStyles(props.session.clientStore, ['theme-bg-secondary'])
              }}></div>
          </DraggableCore>
      }
      <SessionWithToolbarComponent session={props.session} loading={loading} markPlugin={markPlugin}
                                   curDocInfo={props.session.userDocs.find(d => d.id === curDocId)}
                                   beforeLoadDoc={beforeLoadDoc}
                                   afterLoadDoc={afterLoadDoc}
                                   filterOuter={filter}
                                   showLayoutIcon={true}
                                   showLockIcon={true}
                                   onEditBaseInfo={props.onEditBaseInfo}
      />
      {
        props.session.showPreview &&
          <DraggableCore key='preview_drag' onDrag={(_, ui) => {
            setPreviewWidth(Math.min(Math.max(previewWidth - ui.deltaX, 90), 700));
          }}>
              <div className='horizontal-drag' style={{
                ...getStyles(props.session.clientStore, ['theme-bg-secondary'])
              }}></div>
          </DraggableCore>
      }
      {
        !loading && props.session.showPreview &&
          <Collapse
              style={{height: '100%', width: `${previewWidth}px`, flexShrink: 0}}
              bordered={false} defaultActiveKey={['1']} onChange={() => {}}>
            {
              previewSession &&
                <Panel showArrow={false} header='目录' key='1'>
                    <ViewOnlySessionComponent
                        iconNoTopLevel='fa-circle-o'
                        iconDirFold='fa-angle-right'
                        iconDirUnFold='fa-angle-down'
                        session={previewSession}
                        onClick={
                          async (path: Path) => {
                            await props.session.zoomInto(path);
                          }
                        }
                        onBulletClick = {
                          async (path) => {
                            await previewSession.toggleBlockCollapsed(path.row);
                            previewSession.save();
                          }
                        }/>
                </Panel>
            }
            {
              markSession &&
                <Panel showArrow={false}  header='收藏' key='2'>
                    <ViewOnlySessionComponent
                        iconTopLevel='fa-bookmark-o'
                        session={markSession}
                        onClick={ async (path) => {
                          const canonicalPath = await props.session.document.canonicalPath(path.row);
                          await props.session.zoomInto(canonicalPath!);
                        }}
                        onBulletClick = {async () => {}}
                        nothingMessage = '暂无收藏内容'
                    />
                </Panel>
            }
            {
              tagSession &&
                <Panel showArrow={false}  header='标签' key='3'>
                    <ViewOnlySessionComponent
                        iconTopLevel='fa-tags'
                        iconNoTopLevel='fa-circle'
                        iconDirFold='fa-angle-right'
                        iconDirUnFold='fa-angle-down'
                        session={tagSession}
                        onClick={ async (path) => {
                          const depth = await tagSession.document.getAncestryPaths(path.row);
                          if (depth.length === 0) {
                            await tagSession.toggleBlockCollapsed(path.row);
                            tagSession.save();
                          } else {
                            const canonicalPath = await props.session.document.canonicalPath(path.row);
                            await props.session.zoomInto(canonicalPath!);
                          }
                        }}
                        onBulletClick = {async (path) => {
                          await tagSession.toggleBlockCollapsed(path.row);
                          tagSession.save();
                        }}
                        nothingMessage = '暂无标签内容'
                    />
                </Panel>
            }
          </Collapse>
      }
    </div>
  );
}

export default YinComponent;

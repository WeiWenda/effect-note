import {
  api_utils,
  DocInfo,
  Document,
  IndexedDBBackend,
  Path,
  Session,
  SubscriptionSearchResult,
  ViewOnlySessionComponent
} from '../../share';

import * as React from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';
import type {MenuProps} from 'antd';
import {Collapse, Input, Menu, Badge, Tag, Space} from 'antd';
import logger from '../../ts/logger';
import {PluginsManager} from '../../ts/plugins';
import {MarksPlugin} from '../../plugins/marks';
import {TagsPlugin} from '../../plugins/tags';
import config from '../../share/ts/vim';
import {getStyles} from '../../share/ts/themes';
import {searchDoc} from '../../share/ts/utils/APIUtils';
import {DraggableCore} from 'react-draggable';
import {LinksPlugin} from '../../plugins/links';
import {SessionWithToolbarComponent} from '../session';
import {mimetypeLookup} from '../../ts/util';
import FileToolsComponent from '../fileTools';
import {useParams, useNavigate, useLoaderData, useSearchParams} from 'react-router-dom';
import {struckThroughHook} from '../../plugins/todo';
import {htmlHook} from '../../plugins/html';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import {default as FileSearch} from '../../share/ts/search';

const { Search } = Input;
const { Panel } = Collapse;

type MenuItem = Required<MenuProps>['items'][number];
class TagTree extends Map<string, TagTree | number> {};

function getTagMap(filteredDocs: DocInfo[], recentDocId: number[], dirtyDocId: number[]): TagTree {
  const tagMap: TagTree = new Map();
  tagMap.set('所有笔记', new Map);
  tagMap.set('最近访问', new Map);
  filteredDocs.forEach(doc => {
    let menuLabel = doc.name!;
    if (dirtyDocId.indexOf(doc.id!) !== -1) {
      menuLabel = '* ' + menuLabel;
    }
    const dir = (JSON.parse(doc.tag!) as string[]).shift();
    (tagMap.get('所有笔记') as TagTree).set(`${menuLabel}${dir ? ' @ ' + dir : ''}`, doc.id!);
    if (recentDocId.indexOf(doc.id!) !== -1) {
      (tagMap.get('最近访问') as TagTree).set(`${menuLabel}${dir ? ' @ ' + dir : ''}`, doc.id!);
    }
    const tagList: string[] = [];
    if (doc.tag) {
      const jsonArray = JSON.parse(doc.tag);
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
function YinComponent(props: {session: Session, pluginManager: PluginsManager}) {
  // @ts-ignore
  const { curDocId } = useParams();
  let [searchParams, setSearchParams] = useSearchParams();
  // @ts-ignore
  const {userDocs} = useLoaderData();
  const navigate = useNavigate();
  const [curMenu, setCurMenu] = useState(props.session.clientStore.getClientSetting('openFile'));
  const [fileListWidth, setFileListWidth] = useState(250);
  const [showFileList , setShowFileList] = useState(props.session.clientStore.getClientSetting('defaultLayout').includes('left'));
  const [activeKey, setActiveKey] = useState(['0', '1']);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [openKeys, setOpenKeys] = useState<string[]>(JSON.parse(props.session.clientStore.getClientSetting('openMenus')));
  const [filter, setFilter] = useState('');
  const [filteredDocIds, setFilteredDocIds] = useState<number[]>([]);
  const [menuItems, setMenuItems] = useState(new Array<MenuItem>());
  const [menuItem2DocId, setMenuItem2DocId] = useState(new Array<number>());
  const [loading, setLoading] = useState(true);
  const [previewSession, setPreviewSession] = useState<Session | null>(null);
  const [markSession, setMarkSession] =  useState<Session | null>(null);
  const [tagSession, setTagSession] =  useState<Session | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const markPlugin = props.pluginManager.getInfo('Marks').value as MarksPlugin;
  const tagPlugin = props.pluginManager.getInfo('Tags').value as TagsPlugin;
  const linkPlugin = props.pluginManager.getInfo('Links').value as LinksPlugin;
  const getPannelHeight = useCallback(() => {
    return (windowHeight - 63 - 2 - 32 - 4 * 46 - 6) / Math.max(activeKey.length, 1);
  }, [windowHeight, activeKey]);
  function getItem(
    label: string,
    key: React.Key,
    children: MenuItem[] | undefined,
    docId?: number,
    icon?: React.ReactNode,
    type?: 'group',
  ): MenuItem {
    let plainLabel: string = label;
    let isModified = label.startsWith('* ');
    if (isModified) {
      plainLabel = label.slice(2);
    }
    let dirTag = '';
    if (plainLabel.split(' @ ').length > 1) {
      dirTag = plainLabel.split(' @ ').pop()!;
      plainLabel = plainLabel.split(' @ ').shift()!;
    }
    let realLabel: React.ReactNode = plainLabel;
    if (!children) {
      realLabel = (
        <FileToolsComponent session={props.session} curDocId={docId!}
                            tagPlugin={tagPlugin}
                            trigger={['contextMenu']}>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <Space>
              <div>{plainLabel}</div>
              {
                dirTag &&
                <Tag>
                  {dirTag}
                </Tag>
              }
            </Space>
            {
              isModified &&
                <ExclamationCircleOutlined style={{color: '#fc9403'}} />
            }
          </div>
        </FileToolsComponent>
      );
    }
    return {
      key,
      icon,
      children,
      label: realLabel,
      type,
    } as MenuItem;
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
          ret.push(getItem(key, oldLength, childItems));
        } else {
          const oldLength = menuID2DocID.length;
          menuID2DocID.push(-2);
          const childItems = getItems(value, menuID2DocID);
          ret.push(getItem(key, oldLength, childItems));
        }
      } else {
        ret.push(getItem(key, menuID2DocID.length, undefined, value));
        menuID2DocID.push(value);
      }
    });
    return ret;
  }
  const updateMenu = (filteredDocs: DocInfo[]) => {
    const menuID2DocID: Array<number> = [];
    const tagMap = getTagMap(filteredDocs,
      props.session.clientStore.getClientSetting('recentDocId'),
      props.session.clientStore.getClientSetting('dirtyDocId'));
    const items = getItems(tagMap, menuID2DocID);
    setMenuItems(items);
    setMenuItem2DocId(menuID2DocID);
  };
  const updateMenuWithFilter = (docs: DocInfo[], filter1: string) => {
    if (filter1) {
      const filteredDocs = docs.filter(x => {
        return filteredDocIds.includes(x.id!);
      });
      if (filteredDocs.length > 0) {
        updateMenu(filteredDocs);
      }
    } else {
      updateMenu(docs);
    }
  };
  // 1. 父页面新建笔记时
  // 2. 修改过滤时
  useEffect(() => {
    updateMenuWithFilter(props.session.userDocs, filter);
  }, [filter, props.session.userDocs]);
  useEffect(() => {
    props.session.userDocs = userDocs;
    updateMenuWithFilter(userDocs, filter);
  }, [userDocs]);
  const markDirty = (docID: number, isDirty: boolean) => {
    const old = props.session.clientStore.getClientSetting('dirtyDocId');
    if (!old.includes(docID) && isDirty) {
      old.push(docID);
      props.session.clientStore.setClientSetting('dirtyDocId', old);
      updateMenuWithFilter(props.session.userDocs, filter);
    } else if (old.includes(docID) && !isDirty) {
      old.splice(old.indexOf(docID), 1);
      props.session.clientStore.setClientSetting('dirtyDocId', old);
      updateMenuWithFilter(props.session.userDocs, filter);
    }
  };
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      console.log('detect window size change');
      setWindowHeight(window.innerHeight);
    });
    setTimeout(() => {
      props.session.emit('changeComment');
      if (elementRef.current) {
        observer.observe(elementRef.current);
      }
    }, 1000);
    props.session.on('changeLayout', (layout) => {
      setShowFileList(layout.includes('left'));
    });
    props.session.replaceListener('save-cloud', (info) => {
      props.session.showMessage('保存成功');
      markDirty(info.docId, false);
    });
    return () => {
      // Cleanup the observer by unobserving all elements
      observer.disconnect();
    };
  }, []);
  const afterLoadDoc = async () => {
    props.session.getCurrentContent(Path.root(), 'application/json').then(c => {
      if (JSON.stringify(JSON.parse(c)) === JSON.stringify(JSON.parse('{ "text": "", "children": [ { "text": "" } ] }'))) {
         props.session.document.getChildren(Path.root()).then(rows => {
           props.session.cursor.setPosition(rows.pop()!, 0).then(() => {
             props.session.emit('updateInner');
           });
         });
      }
    });
    const docStore = props.session.document.store;
    props.session.reset_history();
    props.session.reset_jump_history();
    const previewDocument = new Document(docStore, '', true);
    async function reloadRow(row: number) {
      await previewDocument.getInfo(row, true);
    }
    async function refreshPreviewSession(document: Document, search?: FileSearch) {
      const newPreviewSession = new Session(props.session.clientStore, document, {});
      if (search) {
        newPreviewSession.search = search;
      }
      newPreviewSession.addHook('renderLineTokenHook', struckThroughHook);
      newPreviewSession.addHook('renderLineTokenHook', htmlHook);
      setPreviewSession(newPreviewSession);
    }
    props.session.document.onEvents(['lineSaved', ], ({row}) => {
      reloadRow(row).then(() => {
        refreshPreviewSession(previewDocument);
      });
    });
    props.session.document.on('loadRow', (path: Path) => {
      reloadRow(path.parent!.row).then(() => {
        refreshPreviewSession(previewDocument);
      });
    });
    props.session.document.on('afterMove', async ({old_parent, new_parent}) => {
      await reloadRow(old_parent);
      await reloadRow(new_parent);
      refreshPreviewSession(previewDocument);
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
            const newMarkSession = new Session(props.session.clientStore, markDocument, {});
            newMarkSession.addHook('renderLineTokenHook', struckThroughHook);
            newMarkSession.addHook('renderLineTokenHook', htmlHook);
            setMarkSession(newMarkSession);
        });
      });
    };
    props.session.document.on('markChange', () => refreshMarkSession());
    const refreshTagSession = () => {
      const tagDocument = new Document(docStore, '');
      const newTagSession = new Session(props.session.clientStore, tagDocument, {});
      newTagSession.addHook('renderLineTokenHook', struckThroughHook);
      newTagSession.addHook('renderLineTokenHook', htmlHook);
      tagPlugin.listTags().then(tags => {
        const childRows: number[] = [];
        const loadTagPromises = Object.entries(tags)
          .filter((t) => !new RegExp('(start|end|due|create):.*').test(t[0]))
          .reduce((p: Promise<void>, tag) =>
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
      refreshPreviewSession(previewDocument);
      props.session.replaceListener('apply_search', (search) => {
        refreshPreviewSession(previewDocument, search);
      });
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
    props.session.document.removeAllListeners('lineSaved');
    props.session.document.removeAllListeners('beforeMove');
    props.session.document.removeAllListeners('beforeAttach');
    props.session.document.removeAllListeners('beforeDetach');
  };
  const loadShareDoc = async (shareUrl: string) => {
    setLoading(true);
    const curDocInfo = {
      name: '网络分享',
      filename: shareUrl
    };
    let initialLoad = true;
    const docID = -2;
    const newDocName = docID.toString();
    props.session.clientStore.setClientSetting('curDocId', docID);
    props.session.clientStore.setDocname(docID);
    await props.session.changeViewRoot(Path.loadFromAncestry(await props.session.clientStore.getLastViewRoot()));
    if (!props.session.clientStore.getDocSetting('loaded')) {
      initialLoad = true;
      // props.session.showMessage('初始加载中...');
      props.session.clientStore.setDocSetting('loaded', true);
    }
    document.title = curDocInfo.name!;
    props.session.document.store.setBackend(new IndexedDBBackend(newDocName), newDocName);
    await beforeLoadDoc();
    console.time(`${initialLoad ? 'initial load' : 'reload'}: ${curDocInfo.name}`);
    if (initialLoad) {
      let docContent = await api_utils.getShareDocContent(shareUrl);
      await markPlugin.clearMarks();
      await props.session.changeViewRoot(Path.root());
      await tagPlugin.clearTags();
      await linkPlugin.clearLinks();
      await props.session.reloadContent(docContent, mimetypeLookup(curDocInfo.filename!)).then(() => {
        props.session.document.onEvents(['lineSaved', 'beforeMove', 'beforeAttach', 'beforeDetach'],
          () => markDirty(docID, true));
        return afterLoadDoc();
      });
      setLoading(false);
    } else {
      props.session.document.onEvents(['lineSaved', 'beforeMove', 'beforeAttach', 'beforeDetach'],
        () => markDirty(docID, true));
      await afterLoadDoc();
      setLoading(false);
    }
    console.timeEnd(`${initialLoad ? 'initial load' : 'reload'}: ${curDocInfo.name}`);
  };
  const loadDoc = async (docID: number) => {
    setLoading(true);
    const curDocInfo = (userDocs as DocInfo[]).find(doc => doc.id === docID);
    if (curDocInfo === undefined) {
      navigate(`/note/-1`);
    }
    let initialLoad = false;
    const newDocName = docID.toString();
    props.session.clientStore.setClientSetting('curDocId', docID);
    props.session.clientStore.setDocname(docID);
    await props.session.changeViewRoot(Path.loadFromAncestry(await props.session.clientStore.getLastViewRoot()));
    if (!props.session.clientStore.getDocSetting('loaded')) {
      initialLoad = true;
      // props.session.showMessage('初始加载中...');
    }
    document.title = curDocInfo.name!;
    props.session.document.store.setBackend(new IndexedDBBackend(newDocName), newDocName);
    props.session.document.store.resetSetCounter(!initialLoad);
    await beforeLoadDoc();
    console.time(`${initialLoad ? 'initial load' : 'reload'}: ${curDocInfo.name}`);
    if (initialLoad) {
      let docContent: any;
      if (docID === -1) {
        docContent = config.getDefaultData();
      } else {
        const docRes = await api_utils.getDocContent(docID);
        docContent = docRes.content;
      }
      await markPlugin.clearMarks();
      await props.session.changeViewRoot(Path.root());
      await tagPlugin.clearTags();
      await linkPlugin.clearLinks();
      await props.session.reloadContent(docContent, mimetypeLookup(curDocInfo.filename!)).then(() => {
        props.session.document.onEvents(['lineSaved', 'beforeMove', 'beforeAttach', 'beforeDetach'],
          () => markDirty(docID, true));
        return afterLoadDoc();
      });
      setLoading(false);
    } else {
      props.session.document.onEvents(['lineSaved', 'beforeMove', 'beforeAttach', 'beforeDetach'],
        () => markDirty(docID, true));
      await afterLoadDoc();
      setLoading(false);
    }
    console.timeEnd(`${initialLoad ? 'initial load' : 'reload'}: ${curDocInfo.name}`);
  };
  useEffect(() => {
    const currentViewRoot = searchParams.get('f');
    const shareUrl = searchParams.get('s');
    if (shareUrl) {
      loadShareDoc(shareUrl);
    } else {
      loadDoc(Number(curDocId)).then(() => {
        if (currentViewRoot) {
          props.session.document.canonicalPath(Number(currentViewRoot)).then(path => {
            if (path) {
              props.session.zoomInto(path);
            }
          });
        }
      });
    }
  }, [curDocId, searchParams]);
  const onClick: MenuProps['onClick'] = e => {
    if (!loading && !props.session.document.store.isBusy()) {
      setCurMenu(e.key);
      props.session.clientStore.setClientSetting('openFile', e.key);
      const remoteDocId = menuItem2DocId[Number(e.key)];
      const recentDocId = props.session.clientStore.getClientSetting('recentDocId');
      if (recentDocId.indexOf(remoteDocId) === -1) {
        recentDocId.push(remoteDocId);
        if (recentDocId.length > 5) {
          recentDocId.shift();
        }
      }
      props.session.clientStore.setClientSetting('recentDocId', recentDocId);
      navigate(`/note/${remoteDocId}`);
    } else {
      props.session.showMessage('正在加载，请勿离开');
    }
  };
  const onOpenChange: MenuProps['onOpenChange'] = keys => {
    // const filteredKeys = keys.filter(key => menuItem2DocId.length > Number(key) && menuItem2DocId[Number(key)] === -2);
    const filteredKeys = keys;
    props.session.clientStore.setClientSetting('openMenus', JSON.stringify(filteredKeys));
    setOpenKeys(filteredKeys);
  };
  const onSearchFileList = (e: string) => {
    searchDoc(e).then((res: SubscriptionSearchResult[]) => {
      if (res.length) {
        props.session.showMessage(`共找到${res.length}条记录`);
      } else {
        props.session.showMessage('未找到匹配内容');
      }
      setFilteredDocIds(res.map(r => Number(r.ref)));
      setFilter(e);
    }).catch(error => {
      props.session.showMessage(error, {warning: true});
    });
  };
  return (
    <div ref={elementRef} style={{height: '100%', flexDirection: 'row', display: 'flex'}}>
      {
        showFileList &&
          <div style={{width: `${fileListWidth}px`, flexShrink: 0}}>
            <Search
                placeholder='搜索笔记名称或内容'
                allowClear
                onSearch={onSearchFileList}
                onPressEnter={(e: any) => {onSearchFileList(e.target.value); }}
                onFocus={() => {props.session.stopKeyMonitor('search-among-file'); } }
                onBlur={() => {props.session.startKeyMonitor(); } }/>
            <Collapse
                className={'file-list-collapse'}
                style={{width: `${fileListWidth}px`}}
                bordered={false} activeKey={activeKey} onChange={(newKeys) => {
                  const nextActiveKeys = Array.isArray(newKeys) ? newKeys : [newKeys];
                  setActiveKey(nextActiveKeys);
            }}>
                <Panel showArrow={false} header={'目录'} key='0'>
                  <Menu
                      style={{height: getPannelHeight(), overflowY: 'auto'}}
                      onClick={onClick}
                      selectedKeys={[curMenu]}
                      onOpenChange={onOpenChange}
                      openKeys={openKeys}
                      mode='inline'
                      items={menuItems}
                  />
                </Panel>
                <Panel showArrow={false} header='大纲' key='1'>
                    <div style={{height: getPannelHeight(), overflowY: 'auto'}}>
                      {
                        previewSession &&
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
                      }
                    </div>
                </Panel>
              {
                markSession &&
                  <Panel showArrow={false}  header='收藏' key='2'>
                      <div style={{height: getPannelHeight(), overflowY: 'auto'}}>
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
                      </div>
                  </Panel>
              }
              {
                tagSession &&
                  <Panel showArrow={false}  header='标签' key='3'>
                      <div style={{height: getPannelHeight(), overflowY: 'auto'}}>
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
                      </div>
                  </Panel>
              }
            </Collapse>
          </div>
      }
      {
        showFileList &&
          <DraggableCore key='filelist_drag' onDrag={(_, ui) => {
            setFileListWidth(Math.min(Math.max(fileListWidth + ui.deltaX, 72), 700));
          }}>
              <div className='horizontal-drag' style={{
                ...getStyles(props.session.clientStore, ['theme-bg-secondary'])
              }}></div>
          </DraggableCore>
      }
      <div style={{width: window.innerWidth - (showFileList ? fileListWidth + 3 : 3),
                  height: '100%'}}>
        <SessionWithToolbarComponent session={props.session} loading={loading} markPlugin={markPlugin}
                                     curDocId={Number(curDocId)}
                                     beforeLoadDoc={beforeLoadDoc}
                                     afterLoadDoc={afterLoadDoc}
                                     filterOuter={filter}
                                     showLayoutIcon={true}
                                     showLockIcon={true}
                                     tagPlugin={tagPlugin}
        />
      </div>
    </div>
  );
}

export default YinComponent;

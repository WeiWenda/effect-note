import {
  api_utils, Session, SessionComponent, SpinnerComponent,
  InMemory, DocumentStore, Document, Path, DocInfo, Modes, IndexedDBBackend, ViewOnlySessionComponent, SerializedBlock, DocVersion
} from '../../share';

import { StarOutlined, StarFilled, LeftOutlined, RightOutlined, HistoryOutlined, UnlockOutlined, LockOutlined} from '@ant-design/icons';

import * as React from 'react';
import type {MenuProps} from 'antd';
import {Menu, Input, Row, Col, Collapse, Space, Popover, Radio} from 'antd';
import {Content} from 'antd/es/layout/layout';
import {useEffect, useState} from 'react';
import FileToolsComponent from '../fileTools';
import logger from '../../ts/logger';
import {getPlugin, PluginsManager} from '../../ts/plugins';
import {MarksPlugin} from '../../plugins/marks';
import {TagsPlugin} from '../../plugins/tags';
import BreadcrumbsComponent from '../breadcrumbs';
import {default as FileSearch} from '../../share/ts/search';
import config from '../../share/ts/vim';
import {getStyles} from '../../share/ts/themes';
import {getDocContent, getDocVersions} from '../../share/ts/utils/APIUtils';
import Moment from 'moment';
import LayoutToolsComponent from '../layoutTools';
import Draggable, {DraggableCore} from 'react-draggable';
import {LinksPlugin} from '../../plugins/links';

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
function useForceUpdate() {
  const [value, setValue] = useState(0); // integer state
  return () => setValue(value + 1); // update state to force render
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

function UserViewComponent(props: {session: Session,
  pluginManager: PluginsManager, curDocId: number, onEditBaseInfo: (docInfo: DocInfo) => void}) {
  const forceUpdate = useForceUpdate();
  const [curMenu, setCurMenu] = useState(props.session.clientStore.getClientSetting('openFile'));
  const [fileListWidth, setFileListWidth] = useState(250);
  const [previewWidth, setPreviewWidth] = useState(300);
  const [openKeys, setOpenKeys] = useState<string[]>(JSON.parse(props.session.clientStore.getClientSetting('openMenus')));
  const [filter, setFilter] = useState('');
  const [filterInner, setFilterInner] = useState('');
  const docs = props.session.userDocs;
  const [menuItems, setMenuItems] = useState(new Array<MenuItem>());
  const [menuItem2DocId, setMenuItem2DocId] = useState(new Array<number>());
  const [loading, setLoading] = useState(true);
  const [previewSession, setPreviewSession] = useState<Session | null>(null);
  const [markSession, setMarkSession] =  useState<Session | null>(null);
  const [tagSession, setTagSession] =  useState<Session | null>(null);
  const [isMarked, setMarked] = useState(false);
  const [isRoot, setIsRoot] = useState(props.session.viewRoot.isRoot());
  const [versions, setVersions] = useState(new Array<DocVersion>());
  const [currentVersion, setCurrentVersion] = useState('');
  const [curDocId, setCurDocId] = useState(props.curDocId);
  const [crumbContents, setCrumbContents] = useState(() => {
    const initialCrumbContents: {[row: number]: string} = {};
    return initialCrumbContents;
  });
  const markPlugin = props.pluginManager.getInfo('Marks').value as MarksPlugin;
  const tagPlugin = props.pluginManager.getInfo('Tags').value as TagsPlugin;
  const linkPlugin = props.pluginManager.getInfo('Links').value as LinksPlugin;
  useEffect(() => {
    props.session.on('changeViewRoot', async (path: Path) => {
      const markInfo = await markPlugin.getMark(path.row);
      setIsRoot(path.isRoot());
      if (markInfo) {
        setMarked(true);
      } else {
        setMarked(false);
      }
      const newCrumbContents: {[row: number]: string} = {};
      while (path.parent != null) {
        path = path.parent;
        newCrumbContents[path.row] = await props.session.document.getText(path.row);
      }
      setCrumbContents(newCrumbContents);
    });
    props.session.replaceListener('save-cloud', (info) => {
      props.session.showMessage('保存成功');
      props.session.userDocs = docs.map(doc => {
        if (doc.id === info.docId) {
          doc.dirtyUpdate = false;
        }
        return doc;
      });
      forceUpdate();
    });
  }, []);
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
          setFilterInner(filter);
          props.session.showMessage('检索完成');
        } else {
          props.session.showMessage('未找到匹配内容');
        }
      });
    } else {
      updateMenu(props.session.userDocs);
    }
  }, [filter, props.session.userDocs]);
  const applyFilterInner = () => {
    if (filterInner) {
      if (!props.session.search) {
        props.session.search = new FileSearch(async (query) => {
          const results = await props.session.document.search(props.session.viewRoot, query);
          console.log(results);
          return {
            rows: new Set(results.flatMap(({path}) => {
              return path.getAncestry();
            })),
            accentMap: new Map(results.map(result => [result.path.row, result.matches]))
          };
        }, props.session);
      }
      props.session.search?.update(filterInner);
    } else {
      props.session.search = null;
    }
  };
  useEffect(() => {
    applyFilterInner();
  }, [filterInner]);
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
    applyFilterInner();
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
      await props.session.reloadContent(docContent).then(() => {
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
  // if (!localStorage.getItem(api_utils.ACCESS_TOKEN) && process.env.REACT_APP_BUILD_PROFILE === 'cloud') {
  //   return (
  //     <Content style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
  //       <Profile
  //         onFinish={async () => {
  //           api_utils.getCurrentUserDocs().then(res => {
  //             props.session.userDocs = res.content;
  //             setLoading(true);
  //             setTimeout(() => {setLoading(false); }, 100);
  //           });
  //         }}
  //         session={props.session}></Profile>
  //     </Content>
  //   );
  // }
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
  const onSearchContent = (searchContent: string) => {
    setFilterInner(searchContent);
  };
  const onCrumbClick = async (path: Path) => {
    const session = props.session;
    await session.zoomInto(path);
    session.save();
    session.emit('updateInner');
  };
  const textColor = props.session.clientStore.getClientSetting('theme-text-primary');
  const selectStyle = `opacity(100%) drop-shadow(0 0 0 ${textColor}) brightness(10)`;
  const unselectStyle = `opacity(10%) drop-shadow(0 0 0 ${textColor})`;
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
      <div style={{flexGrow: 1, overflow: 'auto'}}>
        {
          loading &&
            <SpinnerComponent/>
        }
        {
          !loading &&
            <div className='file-toolbar' style={{
              borderColor: props.session.clientStore.getClientSetting('theme-bg-secondary')
            }}>
                <Space style={{paddingLeft: '10px'}}>
                    <LeftOutlined
                        onClick={() => {
                          props.session.jumpPrevious();
                        }}
                        style={{
                          filter:  props.session.jumpIndex === 0 ? unselectStyle : selectStyle
                        }}/>
                    <RightOutlined
                        onClick={() => {
                          props.session.jumpNext();
                        }}
                        style={{
                          filter: (props.session.jumpIndex + 1 >= props.session.jumpHistory.length ) ? unselectStyle : selectStyle
                        }}/>
                    <BreadcrumbsComponent key='crumbs'
                                          session={props.session}
                                          viewRoot={props.session.viewRoot}
                                          onCrumbClick={onCrumbClick}
                                          crumbContents={crumbContents}/>
                </Space>
                <Space>
                  {
                    props.session.vimMode &&
                      <span style={{fontSize: 12, float: 'right', paddingRight: '20px'}}>
                {'-- ' +  Modes.getMode(props.session.mode).name + ' --'}
              </span>
                  }
                    <Search
                        size='small'
                        placeholder='搜索内容'
                        allowClear
                        value={filterInner}
                        onChange={(e) => onSearchContent(e.target.value)}
                        onPressEnter={(e: any) => {onSearchContent(e.target.value); }}
                        onFocus={() => {props.session.stopMonitor = true; } }
                        onBlur={() => {props.session.stopMonitor = false; } }/>
                    <LayoutToolsComponent session={props.session} />
                  {
                    props.session.lockEdit &&
                      <LockOutlined onClick={() => {
                        props.session.lockEdit = false;
                        props.session.showMessage('进入编辑模式');
                        forceUpdate();
                      }}/>
                  }
                  {
                    !props.session.lockEdit &&
                      <UnlockOutlined onClick={() => {
                        props.session.lockEdit = true;
                        props.session.showMessage('进入锁定模式');
                        forceUpdate();
                      }} />
                  }
                  {
                    isMarked && !isRoot &&
                      <StarFilled onClick={() => {
                        markPlugin.setMark(props.session.viewRoot.row, '').then(() => {
                          setMarked(false);
                        });
                      }} />
                  }
                  {
                    !isMarked && !isRoot &&
                      <StarOutlined onClick={() => {
                        props.session.document.getText(props.session.viewRoot.row).then(text => {
                          markPlugin.setMark(props.session.viewRoot.row, text).then(() => {
                            setMarked(true);
                          });
                        });
                      }}/>
                  }
                  {
                    curDocId !== -1 &&
                    // process.env.REACT_APP_BUILD_PROFILE === 'local' &&
                      <Popover placement='bottom' content={
                        <div style={{width: '200px', maxHeight: '100px', overflowY: 'auto'}}>
                          <Radio.Group onChange={(v) => {
                            setCurrentVersion(v.target.value);
                            getDocContent(Number(curDocId), v.target.value).then((res) => {
                              props.session.showMessage('版本回溯中...');
                              beforeLoadDoc().then(() => {
                                props.session.reloadContent(res.content).then(() => {
                                  afterLoadDoc().then(() => {
                                    props.session.showMessage('版本回溯完成');
                                  });
                                });
                              });
                            });
                          }} value={currentVersion}>
                            <Space direction='vertical'>
                              {
                                versions.map(version => {
                                  return (
                                    <Radio value={version.commitId}>
                                      {Moment.unix(version.time).format('yyyy-MM-DD HH:mm:ss')}
                                    </Radio>
                                  );
                                })
                              }
                            </Space>
                          </Radio.Group>
                        </div>
                      }
                               trigger='click'
                               onOpenChange={(open) => {
                                 if (open) {
                                   getDocVersions(Number(curDocId)).then(res => setVersions(res));
                                 }
                               }}>
                          <HistoryOutlined />
                      </Popover>
                  }
                  {
                    curDocId !== -1 &&
                      <FileToolsComponent session={props.session} curDocId={curDocId}
                                          onEditBaseInfo={() => props.onEditBaseInfo(docs.find(doc => doc.id === curDocId)!)}
                                          reloadFunc={(operationType: string) => {
                                            if (operationType === 'remove') {
                                              forceUpdate();
                                            }
                                          }}/>
                  }
                </Space>
            </div>
        }
        {
          !loading &&
            <SessionComponent ref={props.session.sessionRef} session={props.session} />
        }
      </div>
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

export default UserViewComponent;

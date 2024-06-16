import React, {Children, cloneElement, useCallback, useEffect, useRef, useState,} from 'react';
import type * as TExcalidraw from '@excalidraw/excalidraw';
import {newElementWith, useI18n} from '@excalidraw/excalidraw';

import $ from 'jquery';

import type {ResolvablePromise} from './utils';
import {
  filterWithPredicate,
  filterWithSelectElementId,
  getTextElementsMatchingQuery,
  resolvablePromise,
  showSelectedShapeActionsFinal,
} from './utils';

import initialData from './initialData';

import type {
  AppState,
  BinaryFileData,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  PointerDownState as ExcalidrawPointerDownState,
} from '@excalidraw/excalidraw/types/types';
import type {
  ExcalidrawElement,
  ExcalidrawTextElement,
  NonDeletedExcalidrawElement,
  Theme,
} from '@excalidraw/excalidraw/types/element/types';
import './App.scss';
import {SessionWithToolbarComponent} from '../session';
import {api_utils, DocInfo, InMemory, Path, Session} from '../../share';
import {hasBoundTextElement, isLinearElement} from './typeChecks';
import Draggable, {DraggableCore, DraggableData, DraggableEvent} from 'react-draggable';
import {Flex, Input, Space, Tag, Tooltip} from 'antd';
import {
  AppstoreAddOutlined,
  BranchesOutlined, CloudUploadOutlined,
  EditOutlined,
  FileSearchOutlined,
  FilterOutlined,
  MergeOutlined,
  NodeIndexOutlined,
  ReadOutlined
} from '@ant-design/icons';
import {useLoaderData, useParams} from 'react-router-dom';

const {Search} = Input;

export interface AppProps {
  session: Session;
  appTitle: string;
  useCustom: (api: ExcalidrawImperativeAPI | null, customArgs?: any[]) => void;
  customArgs?: any[];
  children: React.ReactNode;
  excalidrawLib: typeof TExcalidraw;
}

export default function PkbProducer({
                              session,
                              appTitle,
                              useCustom,
                              customArgs,
                              children,
                              excalidrawLib,
                            }: AppProps) {
  const {
    exportToCanvas,
    exportToSvg,
    exportToBlob,
    exportToClipboard,
    useHandleLibrary,
    MIME_TYPES,
    Sidebar,
    WelcomeScreen,
    MainMenu,
    convertToExcalidrawElements,
  } = excalidrawLib;
  // @ts-ignore
  const { curDocId } = useParams();
  // @ts-ignore
  const {userDocs} = useLoaderData();
  const appRef = useRef<any>(null);
  const { t } = useI18n();
  const [selectNodeId, setSelectNodeId] = useState<string>('');
  const [editingTextId, setEditingTextId] = useState<string>('');
  const [editingDocId, setEditingDocId] = useState<number>(-1);
  const [boardX, setBoardX] = useState(70);
  const [boardY, setBoardY] = useState(17);
  const [showFilter, setShowFilter] = useState(false);
  const [showShapes, setShowShapes] = useState(true);
  const [showSelectedShapeActions, setShowSelectedShapeActions] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [docked, setDocked] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [viewMode, setViewMode] = useState(false);
  const [disableImageTool, setDisableImageTool] = useState(false);
  const [tagsData, setTagsData] = useState(['Movies', 'Books', 'Music', 'Sports']);
  const [visibleShapes, setVisibleShapes] = useState(['rectangle', 'diamond', 'ellipse']);
  const [selectedTags, setSelectedTags] = React.useState<string[]>(['Movies']);
  const initialStatePromiseRef = useRef<{
    promise: ResolvablePromise<ExcalidrawInitialDataState | null>;
  }>({ promise: null! });
  if (!initialStatePromiseRef.current.promise) {
    initialStatePromiseRef.current.promise =
      resolvablePromise<ExcalidrawInitialDataState | null>();
  }
  useEffect(() => {
    session.userDocs = userDocs;
  }, [userDocs]);
  useEffect(() => {
    if (curDocId && Number(curDocId) > 0) {
      session.clientStore.setClientSetting('curPkbId', Number(curDocId));
      api_utils.getDocContent(Number(curDocId)).then((res) => {
        const elements = JSON.parse(res.content).elements as readonly ExcalidrawElement[];
        // @ts-ignore
        initialStatePromiseRef.current.promise.resolve({
          ...initialData,
          elements: elements
        });
      });
    } else {
      // @ts-ignore
      initialStatePromiseRef.current.promise.resolve(initialData);
    }
  }, [curDocId]);
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  useCustom(excalidrawAPI, customArgs);

  useHandleLibrary({ excalidrawAPI });

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
    if (showShapes) {
      $('.shapes-section').removeClass('visually-hidden');
    } else {
      $('.shapes-section').addClass('visually-hidden');
    }
    if (showLibrary) {
      $('.sidebar-trigger').removeClass('visually-hidden');
    } else {
      $('.sidebar-trigger').addClass('visually-hidden');
    }
  }, [excalidrawAPI]);

  const renderExcalidraw = (children: React.ReactNode) => {
    const Excalidraw: any = Children.toArray(children).find(
      (child) =>
        React.isValidElement(child) &&
        typeof child.type !== 'string' &&
        //@ts-ignore
        child.type.displayName === 'Excalidraw',
    );
    if (!Excalidraw) {
      return;
    }
    const newElement = cloneElement(
      Excalidraw,
      {
        langCode: 'zh-CN',
        excalidrawAPI: (api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api),
        initialData: initialStatePromiseRef.current.promise,
        onChange: (
          elements: NonDeletedExcalidrawElement[],
          state: AppState,
        ) => {
          // const shapePanel = $('.shapes-section').detach();
          // $('.ant-layout-header').append(shapePanel);
          // 更新样式编辑工具的位置
          if (showSelectedShapeActionsFinal(excalidrawAPI?.getAppState()!)) {
            var actionPannel = $( '.selected-shape-actions .App-menu__left').detach();
            $('#selected-shape-actions-wrapper').append(actionPannel);
          } else {
            var actionPannel = $( '#selected-shape-actions-wrapper .App-menu__left').detach();
            $('.selected-shape-actions').append(actionPannel);
          }
          if (state.viewModeEnabled) {
            excalidrawAPI?.setCursor('pointer');
            setViewMode(true);
          }
          // 避免内容丢失
          if (!state.openSidebar) {
            saveDocIfNeed();
          }
        },
        // viewModeEnabled,
        // zenModeEnabled,
        // gridModeEnabled,
        theme,
        name: 'Custom name of drawing',
        UIOptions: {
          canvasActions: {
            loadScene: true,
          },
          tools: { image: !disableImageTool },
        },
        onLinkOpen,
        onPointerDown,
        validateEmbeddable: true,
      },
      <>
        <WelcomeScreen />
        {
          (showSearch || showFilter || showSelectedShapeActions) &&
          <Draggable
            defaultClassName={'operation-board'}
            position={{x: boardX, y: boardY}}
            onDrag={(_ , ui) => {
              setBoardX(ui.x);
              setBoardY(ui.y);
            }}
            >
            <div style={{width: '202px'}}>
              {
                showSearch &&
                <Search
                  allowClear
                  placeholder='节点搜索'
                  onSearch={(text) => {
                    if (!text) {
                      return;
                    }
                    const res = text.matchAll(/"(.*?)"/g);
                    let query: string[] = [];
                    let parts;
                    while (!(parts = res.next()).done) {
                      query.push(parts.value[1]);
                    }
                    text = text.replaceAll(/"(.*?)"/g, '');
                    query = query.concat(text.split(' ').filter((s) => s.length !== 0));
                    let match = getTextElementsMatchingQuery(
                      (excalidrawAPI?.getSceneElements() || []).filter((el) => el.type === 'text'),
                      query
                    );

                    if (match.length === 0) {
                      excalidrawAPI?.setToast({message: '未找到匹配项', duration: 1000});
                      return false;
                    }
                    excalidrawAPI?.updateScene({appState: {selectedElementIds: Object.fromEntries(
                          match.map((e) => [e.id, true]),
                        )}});
                    if (match.length === 1) {
                      excalidrawAPI?.scrollToContent(match[0]);
                    }
                  }}
                />
              }
              {
                showFilter &&
                <div style={{background: 'var(--island-bg-color)', padding: '0.75rem',
                          borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem'}}>
                  {/*<div className={'operation-title'}>节点标签</div>*/}
                  {/*<Flex className={'operation-options'} gap={5} wrap={'wrap'} >*/}
                  {/*  {tagsData.map<React.ReactNode>((tag) => (*/}
                  {/*    <Tag.CheckableTag*/}
                  {/*      key={tag}*/}
                  {/*      checked={selectedTags.includes(tag)}*/}
                  {/*      onChange={(checked) => {*/}
                  {/*        const nextSelectedTags = checked*/}
                  {/*          ? [...selectedTags, tag]*/}
                  {/*          : selectedTags.filter((t) => t !== tag);*/}
                  {/*        setSelectedTags(nextSelectedTags);*/}
                  {/*      }}*/}
                  {/*    >*/}
                  {/*      {tag}*/}
                  {/*    </Tag.CheckableTag>*/}
                  {/*  ))}*/}
                  {/*</Flex>*/}
                  <div className={'operation-title'}>节点形状</div>
                  <Flex className={'operation-options'} gap={5} wrap={'wrap'} >
                    {['rectangle', 'diamond', 'ellipse'].map<React.ReactNode>((tag) => (
                      <Tag.CheckableTag
                        key={tag}
                        checked={visibleShapes.includes(tag)}
                        onChange={(checked) => {
                          const nextSelectedTags = checked
                            ? [...visibleShapes, tag]
                            : visibleShapes.filter((s) => s !== tag);
                          excalidrawAPI?.updateScene({
                            elements: filterWithPredicate(excalidrawAPI?.getSceneElements()!, e => nextSelectedTags.includes(e.type))
                          });
                          setVisibleShapes(nextSelectedTags);
                        }}
                      >
                        {t(`toolBar.${tag}`)}
                      </Tag.CheckableTag>
                    ))}
                  </Flex>
                  {/*<div className={'operation-title'}>关系标签</div>*/}
                  {/*<Flex className={'operation-options'} gap={5} wrap={'wrap'} >*/}
                  {/*  {tagsData.map<React.ReactNode>((tag) => (*/}
                  {/*    <Tag.CheckableTag*/}
                  {/*      key={tag}*/}
                  {/*      checked={selectedTags.includes(tag)}*/}
                  {/*      onChange={(checked) => {*/}
                  {/*        const nextSelectedTags = checked*/}
                  {/*          ? [...selectedTags, tag]*/}
                  {/*          : selectedTags.filter((t) => t !== tag);*/}
                  {/*        setSelectedTags(nextSelectedTags);*/}
                  {/*      }}*/}
                  {/*    >*/}
                  {/*      {tag}*/}
                  {/*    </Tag.CheckableTag>*/}
                  {/*  ))}*/}
                  {/*</Flex>*/}
                </div>
              }
              {
                showSelectedShapeActions &&
                <div id = 'selected-shape-actions-wrapper'/>
              }
            </div>
          </Draggable>
        }
        <Sidebar name='node-content' className={'excalidraw-node-content'}
                 docked={docked}
                 onDock={(newDocked) => setDocked(newDocked)}>
          <DraggableCore key='drawer_drag'
                         scale={1.2}
                         onDrag={(e: DraggableEvent, ui: DraggableData) => {
                           const currentWidth = $('.excalidraw-node-content').width()!;
                           document.documentElement.style.setProperty(
                             '--excalidraw-node-content-width', `${currentWidth + 2 - ui.deltaX}px`);
                         }}>
            <div className='horizontal-drag' style={{zIndex: '3', height: '100%', position: 'absolute'}}></div>
          </DraggableCore>
          <Sidebar.Header >
            <div
              style={{
                color: 'var(--color-primary)',
                fontSize: '1.2em',
                fontWeight: 'bold',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                paddingRight: '1em',
              }}
            >
              节点详情
            </div>
            <Space>
              <Tooltip title={'进入途经点子图'}>
                <NodeIndexOutlined onClick={() => {
                  excalidrawAPI?.updateScene({
                    elements: filterWithSelectElementId('up_down', excalidrawAPI?.getSceneElements()!, selectNodeId)
                  });
                }}/>
              </Tooltip>
              <Tooltip title={'进入终点子图'} >
                <BranchesOutlined onClick={() => {
                  excalidrawAPI?.updateScene({
                    elements: filterWithSelectElementId('up', excalidrawAPI?.getSceneElements()!, selectNodeId)
                  });
                }} />
              </Tooltip>
              <Tooltip title={'进入起点子图'}>
                <MergeOutlined onClick={() => {
                  excalidrawAPI?.updateScene({
                    elements: filterWithSelectElementId('down', excalidrawAPI?.getSceneElements()!, selectNodeId)
                  });
                }}/>
              </Tooltip>
            </Space>
          </Sidebar.Header>
          <div
            style={{height: '100%'}}
            onMouseEnter={() => {
            session.startKeyMonitor();
          }} onMouseLeave={() => {
            session.stopKeyMonitor('sidebar-enter');
          }}
          >
            <SessionWithToolbarComponent session={session}
                                         loading={false}
                                         curDocId={-3}
                                         filterOuter={''}
                                         showLayoutIcon={false}
                                         showLockIcon={true} />

          </div>
        </Sidebar>
        {renderMenu()}
      </>,
    );
    return newElement;
  };

  // const loadSceneOrLibrary = async () => {
  //   const file = await fileOpen({ description: 'Excalidraw or library file' });
  //   const contents = await loadSceneOrLibraryFromBlob(file, null, null);
  //   if (contents.type === MIME_TYPES.excalidraw) {
  //     excalidrawAPI?.updateScene(contents.data as any);
  //   } else if (contents.type === MIME_TYPES.excalidrawlib) {
  //     excalidrawAPI?.updateLibrary({
  //       libraryItems: (contents.data as ImportedLibraryData).libraryItems!,
  //       openLibraryMenu: true,
  //     });
  //   }
  // };
  const saveDocIfNeed = async () => {
    if (editingTextId) {
      console.log(`正在保存内容到节点 ${editingTextId}`);
      const content = await session.getCurrentContent(Path.root(), 'application/json');
      excalidrawAPI?.updateScene({
        elements: excalidrawAPI?.getSceneElements().map(e => {
          if (e.id === editingTextId) {
            return newElementWith(e as ExcalidrawTextElement, {originalText: content});
          } else {
            return e;
          }
        })
      });
      setEditingTextId('');
    } else if (editingDocId > 0) {
      console.log(`正在保存内容到文档 ${editingDocId}`);
      session.reUploadFile(Path.root(), editingDocId).then(() => {
        setEditingDocId(-1);
        excalidrawAPI?.setToast({message: '节点保存成功', duration: 1000});
      });
    }
  };

  const loadDoc = async (res: DocInfo) => {
    await saveDocIfNeed();
    session.document.store.setBackend(new InMemory(), res.id!.toString());
    session.document.root = Path.root();
    session.cursor.reset();
    session.document.cache.clear();
    session.stopAnchor();
    session.search = null;
    session.document.removeAllListeners('lineSaved');
    session.document.removeAllListeners('afterMove');
    session.document.removeAllListeners('afterAttach');
    session.document.removeAllListeners('afterDetach');
    session.document.removeAllListeners('markChange');
    session.document.removeAllListeners('tagChange');
    let content = res.content!;
    await session.reloadContent(content, 'application/json');
    session.reset_history();
    session.reset_jump_history();
  };

  const onLinkOpen = useCallback(
    (
      element: NonDeletedExcalidrawElement,
      event: CustomEvent<{
        nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement>;
      }>,
    ) => {
      const link = element.link!;
      const { nativeEvent } = event.detail;
      const isNewTab = nativeEvent.ctrlKey || nativeEvent.metaKey;
      const isNewWindow = nativeEvent.shiftKey;
      const isInternalLink =
        link.startsWith('/') || link.includes(window.location.origin);
      if (isInternalLink && !isNewTab && !isNewWindow) {
        // signal that we're handling the redirect ourselves
        event.preventDefault();
        const docID = Number(link.split('/note/').pop()?.split('?').shift());
        session.clientStore.setDocname(docID);
        api_utils.getDocContent(docID).then(res => {
          loadDoc(res).then(() => {
            const viewRoot = link.split('f=').pop()?.split('&').shift();
            session.document.canonicalPath(Number(viewRoot)).then(path => {
              session.changeViewRoot(path || Path.root()).then(() => {
                setEditingDocId(docID);
                setEditingTextId('');
                setSelectNodeId(element.id);
                excalidrawAPI?.updateScene({appState: {openSidebar: {name: 'node-content'}}});
                console.log('onLinkOpen', docID, viewRoot);
              });
            });
          });
        });
        // do a custom redirect, such as passing to react-router
        // ...
      }
    },
    [excalidrawAPI],
  );

  const onPointerDown = (
    activeTool: AppState['activeTool'],
    pointerDownState: ExcalidrawPointerDownState,
  ) => {
    if (activeTool.type === 'selection' && pointerDownState.hit.element) {
      if (hasBoundTextElement(pointerDownState.hit.element) && !isLinearElement(pointerDownState.hit.element)) {
        const textElementId = pointerDownState.hit.element.boundElements?.find(({ type }) => type === 'text');
        const textElement = excalidrawAPI?.getSceneElements().find(e => e.id === textElementId?.id) as ExcalidrawTextElement;
        let content = '{"text": ""}';
        try {
           if (typeof JSON.parse(textElement.originalText) === 'object') {
             content = textElement.originalText;
           }
        } catch (e) {
          // do nothing
        }
        loadDoc({id: -1, content}).then(() => {
          setTimeout(() => {
            setEditingTextId(textElementId!.id);
            setSelectNodeId(pointerDownState.hit.element!.id);
            excalidrawAPI?.updateScene({appState: {openSidebar: { name: 'node-content'}}});
          });
        });
      }
    } else {
      console.log(activeTool, pointerDownState);
    }
  };
  const renderMenu = () => {
    return (
      <MainMenu>
        <MainMenu.DefaultItems.LoadScene />
        {
          Number(curDocId) > 0 &&
          <MainMenu.Item icon={<CloudUploadOutlined />} onSelect={() => {
            console.log('保存至EffectNote');
            if (!excalidrawAPI) {
              return false;
            }
            exportToClipboard({
              elements: excalidrawAPI.getSceneElements(),
              appState: excalidrawAPI.getAppState(),
              files: excalidrawAPI.getFiles(),
              type: 'json',
            }).then(() => {
              navigator.clipboard.readText().then(content => {
                const docInfo = { ...userDocs.find((doc: any) => doc.id === Number(curDocId))!,
                  content: JSON.stringify(JSON.parse(content), undefined, 2)};
                api_utils.updateDoc(Number(curDocId), docInfo).then(() => {
                  excalidrawAPI.setToast({message: '画板保存成功', duration: 1000});
                });
              });
            });
          }}>
            保存至EffectNote
          </MainMenu.Item>
        }
        <MainMenu.DefaultItems.SaveToActiveFile />
        <MainMenu.DefaultItems.Export />
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.Help />
        <MainMenu.DefaultItems.ClearCanvas />
        <MainMenu.Separator />
        <MainMenu.Item icon={<AppstoreAddOutlined />} onSelect={() => {
          if (showShapes) {
            $('.shapes-section').addClass('visually-hidden');
          } else {
            $('.shapes-section').removeClass('visually-hidden');
          }
          setShowShapes(!showShapes);
        }}>
          形状工具
        </MainMenu.Item>
        <MainMenu.Item icon={<ReadOutlined />} onSelect={() => {
          if (showLibrary) {
            $('.sidebar-trigger').addClass('visually-hidden');
          } else {
            $('.sidebar-trigger').removeClass('visually-hidden');
          }
          setShowLibrary(!showLibrary);
        }}>
          素材库
        </MainMenu.Item>
        <MainMenu.Item icon={<FileSearchOutlined />} onSelect={() => setShowSearch(!showSearch)}>
          节点搜索工具
        </MainMenu.Item>
        <MainMenu.Item icon={<FilterOutlined />} onSelect={() => setShowFilter(!showFilter)}>
          节点过滤工具
        </MainMenu.Item>
        <MainMenu.Item icon={<EditOutlined />} onSelect={() => {
          if (showSelectedShapeActions) {
            $('.App-menu__left').addClass('visually-hidden');
          } else {
            $('.App-menu__left').removeClass('visually-hidden');
          }
          setShowSelectedShapeActions(!showSelectedShapeActions);
        }}>
          样式编辑工具
        </MainMenu.Item>
        {/*<MainMenu.DefaultItems.Socials />*/}
        {/*<MainMenu.Separator />*/}
        {/*<MainMenu.DefaultItems.ToggleTheme*/}
        {/*  allowSystemTheme*/}
        {/*  theme={props.theme}*/}
        {/*  onSelect={props.setTheme}*/}
        {/*/>*/}
        {/*<MainMenu.ItemCustom>*/}
        {/*  <LanguageList style={{ width: '100%' }} />*/}
        {/*</MainMenu.ItemCustom>*/}
        <MainMenu.DefaultItems.ChangeCanvasBackground />
      </MainMenu>
    );
  };

  return (
    <div className='App' ref={appRef}>
      <div className='excalidraw-wrapper'>
        {renderExcalidraw(children)}
      </div>
    </div>
  );
}

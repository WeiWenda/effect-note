import React, {Children, cloneElement, useCallback, useEffect, useRef, useState,} from 'react';
import type * as TExcalidraw from '@excalidraw/excalidraw';
import {newElementWith, useI18n} from '@excalidraw/excalidraw';
import { parseMermaidToExcalidraw } from '@excalidraw/mermaid-to-excalidraw';

import $ from 'jquery';

import type {ResolvablePromise} from './utils';
import {
  filterWithPredicate,
  filterWithSelectElementId, getNormalizedZoom,
  getTextElementsMatchingQuery,
  resolvablePromise, selectWithSelectElementId,
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
import {api_utils, DocInfo, EMPTY_BLOCK, InMemory, Path, Session} from '../../share';
import {getBoundTextOrDefault, hasBoundTextElement, isArrowElement, isBindableElement, isLinearElement} from './typeChecks';
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
  ReadOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import {useLoaderData, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {uploadJson} from '../../share/ts/utils/APIUtils';
import {copyToClipboard} from '../index';

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
    convertToExcalidrawElements
  } = excalidrawLib;
  // @ts-ignore
  const { curDocId } = useParams();
  let [searchParams, setSearchParams] = useSearchParams();
  // @ts-ignore
  const {userDocs} = useLoaderData();
  const appRef = useRef<any>(null);
  const { t } = useI18n();
  const navigate = useNavigate();
  const [selectNodeId, setSelectNodeId] = useState<string>('');
  const [editingDocId, setEditingDocId] = useState<number>(-1);
  const [editingElementText, setEditingElementText] = useState<string>('节点详情');
  const [boardX, setBoardX] = useState(70);
  const [boardY, setBoardY] = useState(17);
  const [showFilter, setShowFilter] = useState(session.clientStore.getClientSetting('curPkbShowFilter'));
  const [showShapes, setShowShapes] = useState(session.clientStore.getClientSetting('curPkbShowShapes'));
  const [showSelectedShapeActions, setShowSelectedShapeActions] = useState(session.clientStore.getClientSetting('curPkbShowSelectedShapeActions'));
  const [showSearch, setShowSearch] = useState(session.clientStore.getClientSetting('curPkbShowSearch'));
  const [showLibrary, setShowLibrary] = useState(session.clientStore.getClientSetting('curPkbShowLibrary'));
  const [docked, setDocked] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [disableImageTool, setDisableImageTool] = useState(false);
  const [tagsData, setTagsData] = useState(['Movies', 'Books', 'Music', 'Sports']);
  const [visibleShapes, setVisibleShapes] = useState(['rectangle', 'diamond', 'ellipse']);
  const [selectedTags, setSelectedTags] = React.useState<string[]>(['Movies']);
  const [initialized, setInitialized] = React.useState(false);
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
    session.clientStore.setClientSetting('curDocId', editingDocId);
  }, [editingDocId]);
  useEffect(() => {
    session.stopKeyMonitor('pkb-init');
    const shareUrl = searchParams.get('s');
    if (curDocId && Number(curDocId) > 0) {
      session.clientStore.setClientSetting('curPkbId', Number(curDocId));
      const contentPromise = shareUrl ? api_utils.getShareDocContent(shareUrl).then(res =>
        JSON.parse(res) as {content: string}) : api_utils.getDocContent(Number(curDocId));
      contentPromise.then((res) => {
        const savedContent = JSON.parse(res.content);
        const elements = savedContent.elements as readonly ExcalidrawElement[];
        setShowLibrary(savedContent.tools?.showLibrary ?? showLibrary);
        setShowShapes(savedContent.tools?.showShapes ?? showShapes);
        setShowFilter(savedContent.tools?.showFilter ?? showFilter);
        setShowSearch(savedContent.tools?.showSearch ?? showSearch);
        setShowSelectedShapeActions(savedContent.tools?.showSelectedShapeActions ?? showSelectedShapeActions);
        if (!initialized) {
          // @ts-ignore
          initialStatePromiseRef.current.promise.resolve({
            ...initialData,
            scrollToContent: false,
            appState: {
              currentItemFontFamily: savedContent.appState?.currentItemFontFamily ?? 2,
              viewBackgroundColor: savedContent.appState?.viewBackgroundColor ?? session.clientStore.getClientSetting('theme-bg-primary'),
              zoom: savedContent.appState?.zoom ?? {value: getNormalizedZoom(session.clientStore.getClientSetting('curPkbZoom'))},
              scrollX: savedContent.appState?.scrollX ?? session.clientStore.getClientSetting('curPkbScrollX'),
              scrollY: savedContent.appState?.scrollY ?? session.clientStore.getClientSetting('curPkbScrollY'),
            },
            elements: elements
          });
          setInitialized(true);
        } else {
          // @ts-ignore
          excalidrawAPI?.updateScene({
            elements, appState: {
              currentItemFontFamily: savedContent.appState?.currentItemFontFamily ?? 2,
              viewBackgroundColor: savedContent.appState?.viewBackgroundColor ?? session.clientStore.getClientSetting('theme-bg-primary'),
              zoom: savedContent.appState?.zoom ?? {value: getNormalizedZoom(session.clientStore.getClientSetting('curPkbZoom'))},
              scrollX: savedContent.appState?.scrollX ?? session.clientStore.getClientSetting('curPkbScrollX'),
              scrollY: savedContent.appState?.scrollY ?? session.clientStore.getClientSetting('curPkbScrollY')
            }
          });
        }
      });
    } else {
      const tagName2Id: Map<string, number> = new Map<string, number>();
      const docId2Type: Map<number, string> = new Map<number, string>();
      const mermaidDefinition = ['flowchart TB'];
      const mermaidSubGraph: Map<string, string[]> = new Map<string, string[]>();
      const getOrCompute = (tagName: string) => {
        if (!tagName2Id.get(tagName)) {
          const nextId = tagName2Id.size + 1;
          tagName2Id.set(tagName, nextId);
          mermaidDefinition.push(`${nextId}[${tagName}]`);
        }
        return tagName2Id.get(tagName);
      };
      for (const docInfo of userDocs as DocInfo[]) {
        const tagArray = JSON.parse(docInfo.tag || '[]');
        const tags = Array.isArray(tagArray) ? tagArray : [];
        mermaidDefinition.push(`doc${docInfo.id}("${docInfo.id}#${docInfo.name}")`);
        docId2Type.set(docInfo.id!, docInfo.filename!.split('.').pop() === 'json' ? 'note' : 'produce');
        for (const tag of tags) {
          const tagNames = tag.split('/') as string[];
          if (!tagNames.length) {
            continue;
          }
          if (!mermaidSubGraph.get(tagNames[0])) {
            mermaidSubGraph.set(tagNames[0], []);
          }
          const subGraphDefinition = mermaidSubGraph.get(tagNames[0])!;
          for (let i = 0; i < tagNames.length - 1; i++) {
            if (tagName2Id.get(tagNames[i]) && tagName2Id.get(tagNames[i + 1])) {
              continue;
            }
            const srcId = getOrCompute(tagNames[i]);
            const dstId = getOrCompute(tagNames[i + 1]);
            subGraphDefinition.push(`${srcId} --> ${dstId}`);
          }
          if (tagNames.length > 0) {
            const finalDir = getOrCompute(tagNames[tagNames.length - 1]);
            subGraphDefinition.push(`${finalDir} --> doc${docInfo.id}`);
          }
        }
      }
      [...mermaidSubGraph.entries()].sort((a, b) => a[1].length - b[1].length).forEach((value) => {
        mermaidDefinition.push(`subgraph ${value[0]}\ndirection LR`);
        mermaidDefinition.push(...value[1]);
        mermaidDefinition.push(`end`);
      });
      parseMermaidToExcalidraw(mermaidDefinition.join('\n'), {
        fontSize: 20,
      }).then(({elements}) => {
        setShowLibrary(session.clientStore.getClientSetting('curPkbShowLibrary'));
        setShowShapes(session.clientStore.getClientSetting('curPkbShowShapes'));
        setShowFilter(session.clientStore.getClientSetting('curPkbShowFilter'));
        setShowSearch(session.clientStore.getClientSetting('curPkbShowSearch'));
        setShowSelectedShapeActions(session.clientStore.getClientSetting('curPkbShowSelectedShapeActions'));
        const convertedElements = convertToExcalidrawElements(elements);
        const finalElements = convertedElements.map(el => {
          if (el.roundness && !isArrowElement(el)) {
            const docId = getBoundTextOrDefault(el, convertedElements, '').split('#')[0];
            return newElementWith(el, {link: `http://localhost:51223/${docId2Type.get(Number(docId))}/${docId}`});
          } else {
            return el;
          }
        });
        if (!initialized) {
          // @ts-ignore
          initialStatePromiseRef.current.promise.resolve({
            ...initialData,
            scrollToContent: false,
            appState: {
              currentItemFontFamily: 2,
              viewBackgroundColor: session.clientStore.getClientSetting('theme-bg-primary'),
              zoom: {value: getNormalizedZoom(session.clientStore.getClientSetting('curPkbZoom'))},
              scrollX: session.clientStore.getClientSetting('curPkbScrollX'),
              scrollY: session.clientStore.getClientSetting('curPkbScrollY'),
            },
            elements: finalElements
          });
          setInitialized(true);
        } else {
          // @ts-ignore
          excalidrawAPI?.updateScene({
            elements: finalElements,
            appState: {
              currentItemFontFamily: 2,
              viewBackgroundColor: session.clientStore.getClientSetting('theme-bg-primary'),
              zoom: {value: getNormalizedZoom(session.clientStore.getClientSetting('curPkbZoom'))},
              scrollX: session.clientStore.getClientSetting('curPkbScrollX'),
              scrollY: session.clientStore.getClientSetting('curPkbScrollY'),
            }
          });
        }
      });
    }
  }, [curDocId, searchParams, userDocs]);
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  useCustom(excalidrawAPI, customArgs);

  useHandleLibrary({ excalidrawAPI });

  useEffect(() => {
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
    if (showSelectedShapeActions) {
      $('.App-menu__left').removeClass('visually-hidden');
    } else {
      $('.App-menu__left').addClass('visually-hidden');
    }
  }, [showShapes, showLibrary, showSelectedShapeActions]);

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
          if (Number(curDocId) === -2) {
            session.clientStore.setClientSetting('curPkbZoom', state.zoom.value);
            session.clientStore.setClientSetting('curPkbScrollX', state.scrollX);
            session.clientStore.setClientSetting('curPkbScrollY', state.scrollY);
            session.clientStore.setClientSetting('curPkbShowLibrary', showLibrary);
            session.clientStore.setClientSetting('curPkbShowFilter', showFilter);
            session.clientStore.setClientSetting('curPkbShowSearch', showSearch);
            session.clientStore.setClientSetting('curPkbShowShapes', showShapes);
            session.clientStore.setClientSetting('curPkbShowSelectedShapeActions', showSelectedShapeActions);
          }
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
          // 避免内容丢失
          if (!state.openSidebar) {
            saveDocIfNeed();
          }
        },
        viewModeEnabled: curDocId && Number(curDocId) > 0 ? undefined : true,
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
                    // @ts-ignore
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
              {editingElementText}
            </div>
            <Space>
              <Tooltip title={'单击选中，双击进入途经点子图'}>
                <NodeIndexOutlined
                  onDoubleClick={() => {
                    excalidrawAPI?.updateScene({
                      elements: filterWithSelectElementId('up_down', excalidrawAPI?.getSceneElements()!, selectNodeId)
                    });
                  }}
                  onClick={() => {
                    // @ts-ignore
                    excalidrawAPI?.updateScene({
                      appState: {
                        selectedElementIds: selectWithSelectElementId('up_down', excalidrawAPI?.getSceneElements()!, selectNodeId)
                      }
                    });
                  }}/>
              </Tooltip>
              <Tooltip title={'单击选中，双击进入终点子图'} >
                <BranchesOutlined
                  onDoubleClick={() => {
                    excalidrawAPI?.updateScene({
                      elements: filterWithSelectElementId('up', excalidrawAPI?.getSceneElements()!, selectNodeId)
                    });
                  }}
                  onClick={() => {
                    // @ts-ignore
                    excalidrawAPI?.updateScene({
                      appState: {
                        selectedElementIds: selectWithSelectElementId('up', excalidrawAPI?.getSceneElements()!, selectNodeId)
                      }
                    });
                  }}/>
              </Tooltip>
              <Tooltip title={'单击选中，双击进入起点子图'}>
                <MergeOutlined
                  onDoubleClick={() => {
                    excalidrawAPI?.updateScene({
                      elements: filterWithSelectElementId('down', excalidrawAPI?.getSceneElements()!, selectNodeId)
                    });
                  }}
                  onClick={() => {
                    // @ts-ignore
                    excalidrawAPI?.updateScene({
                      appState: {
                        selectedElementIds: selectWithSelectElementId('down', excalidrawAPI?.getSceneElements()!, selectNodeId)
                      }
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
                                         curDocId={-1}
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
    if (!selectNodeId) {
      return;
    }
    if (editingDocId > 0) {
      console.log(`正在保存内容到文档 ${editingDocId}`);
      await session.reUploadFile(Path.root(), editingDocId).then(() => {
        setEditingDocId(-1);
        setSelectNodeId('');
        excalidrawAPI?.setToast({message: '节点保存成功', duration: 1000});
      });
    } else {
      const content = await session.getCurrentContent(Path.root(), 'application/json');
      setSelectNodeId('');
      if (content === JSON.stringify(EMPTY_BLOCK, undefined, 2)) {
        return;
      }
      console.log(`正在保存内容到节点 ${selectNodeId}`);
      excalidrawAPI?.updateScene({
        elements: excalidrawAPI?.getSceneElements().map(e => {
          if (e.id === selectNodeId) {
            return newElementWith(e as ExcalidrawTextElement, {link: '点击查看节点详情', customData: {'detail': content}});
          } else {
            return e;
          }
        })
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
    await session.emitAsync('clearPluginStatus');
  };

  const handleLinkOpen = useCallback((element: NonDeletedExcalidrawElement) => {
    if (element.link) {
      const link = element.link;
      const isNoteLink =
        link.startsWith(window.location.origin + '/note') || link.startsWith('http://localhost:51223/note');
      const isProduceLink =
        link.startsWith(window.location.origin + '/produce') || link.startsWith('http://localhost:51223/produce');
      if (link === '点击查看节点详情' && element.customData && element.customData.detail) {
        loadDoc({id: -1, content: element.customData.detail}).then(() => {
          session.changeViewRoot(Path.root()).then(() => {
            setTimeout(() => {
              setSelectNodeId(element.id);
              setEditingElementText(getBoundTextOrDefault(element,  excalidrawAPI?.getSceneElements(), '节点详情'));
              excalidrawAPI?.updateScene({appState: {openSidebar: { name: 'node-content'}}});
            });
          });
        });
        return true;
      } else if (isNoteLink) {
        // signal that we're handling the redirect ourselves
        const docID = Number(link.split('/note/').pop()?.split('?').shift());
        session.clientStore.setDocname(docID);
        api_utils.getDocContent(docID).then(res => {
          loadDoc(res).then(() => {
            const viewRoot = link.split('f=').pop()?.split('&').shift();
            session.document.canonicalPath(Number(viewRoot)).then(path => {
              session.changeViewRoot(path || Path.root()).then(() => {
                setEditingDocId(docID);
                setSelectNodeId(element.id);
                setEditingElementText(getBoundTextOrDefault(element,  excalidrawAPI?.getSceneElements(), '节点详情'));
                excalidrawAPI?.updateScene({appState: {openSidebar: {name: 'node-content'}}});
                console.log('onLinkOpen', docID, viewRoot);
              });
            });
          });
        });
        return true;
        // do a custom redirect, such as passing to react-router
        // ...
      } else if (isProduceLink) {
        navigate('/produce/' + link.split('/').pop()!.split('?')[0]);
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }, [excalidrawAPI, selectNodeId, editingDocId]);

  const onLinkOpen = (
      element: NonDeletedExcalidrawElement,
      event: CustomEvent<{
        nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement>;
      }>
  ) => {
    const { nativeEvent } = event.detail;
    const isNewTab = nativeEvent.ctrlKey || nativeEvent.metaKey;
    const isNewWindow = nativeEvent.shiftKey;
    if (isNewTab || isNewWindow) {
      return;
    }
    if (handleLinkOpen(element)) {
      event.preventDefault();
    }
  };

  const onPointerDown = (
    activeTool: AppState['activeTool'],
    pointerDownState: ExcalidrawPointerDownState,
  ) => {
    if (activeTool.type === 'selection' && pointerDownState.hit.element) {
      if (pointerDownState.hit.element.link) {
        handleLinkOpen(pointerDownState.hit.element);
      } else {
        if (isBindableElement(pointerDownState.hit.element)) {
          const editingElement = pointerDownState.hit.element;
          loadDoc({id: -1, content: JSON.stringify(EMPTY_BLOCK)}).then(() => {
            session.changeViewRoot(Path.root()).then(() => {
              setTimeout(() => {
                setSelectNodeId(editingElement.id);
                setEditingElementText(getBoundTextOrDefault(editingElement,  excalidrawAPI?.getSceneElements(), '节点详情'));
                excalidrawAPI?.updateScene({appState: {openSidebar: { name: 'node-content'}}});
              });
            });
          });
        }
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
            if (process.env.REACT_APP_BUILD_PROFILE === 'demo') {
              session.showMessage('Demo部署环境下，该功能不可用', {warning: true});
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
                  content: JSON.stringify({
                    ...JSON.parse(content),
                    appState: excalidrawAPI.getAppState(),
                    tools: {
                      showLibrary,
                      showShapes,
                      showSearch,
                      showFilter,
                      showSelectedShapeActions
                    }
                  }, undefined, 2)};
                api_utils.updateDoc(Number(curDocId), docInfo).then(() => {
                  excalidrawAPI.setToast({message: '画板保存成功', duration: 1000});
                });
              });
            });
          }}>
            保存至EffectNote
          </MainMenu.Item>
        }
        {
          session.serverConfig.imgur?.type === 'picgo' && process.env.REACT_APP_BUILD_PLATFORM !== 'mas' &&
          <MainMenu.Item icon={<ShareAltOutlined />} onSelect={() => {
            console.log('生成分享链接');
            if (!excalidrawAPI) {
              return false;
            }
            if (process.env.REACT_APP_BUILD_PROFILE === 'demo') {
              session.showMessage('Demo部署环境下，该功能不可用', {warning: true});
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
                  content: JSON.stringify({
                    ...JSON.parse(content),
                    appState: excalidrawAPI.getAppState(),
                    tools: {
                      showLibrary,
                      showShapes,
                      showSearch,
                      showFilter,
                      showSelectedShapeActions
                    }
                  }, undefined, 2)};
                uploadJson(
                  JSON.stringify(docInfo),
                  session.clientStore.getClientSetting('curDocId'),
                  session.serverConfig.imgur!).then(shareUrl => {
                  const url = `http://demo.effectnote.com/produce/1?s=${shareUrl}`;
                  copyToClipboard(url);
                  excalidrawAPI.setToast({message: '已复制到粘贴板', duration: 1000});
                }).catch(e => {
                  console.error(e);
                  session.showMessage(`分享失败，报错信息: ${e.message}`);
                });
              });
            });
          }}>
            生成分享链接
          </MainMenu.Item>
        }
        <MainMenu.DefaultItems.SaveToActiveFile />
        <MainMenu.DefaultItems.Export />
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.Help />
        <MainMenu.DefaultItems.ClearCanvas />
        <MainMenu.Separator />
        <MainMenu.Item icon={<AppstoreAddOutlined />} onSelect={() => setShowShapes(!showShapes)}>
          形状工具
        </MainMenu.Item>
        <MainMenu.Item icon={<ReadOutlined />} onSelect={() => setShowLibrary(!showLibrary)}>
          素材库
        </MainMenu.Item>
        <MainMenu.Item icon={<FileSearchOutlined />} onSelect={() => setShowSearch(!showSearch)}>
          节点搜索工具
        </MainMenu.Item>
        <MainMenu.Item icon={<FilterOutlined />} onSelect={() => setShowFilter(!showFilter)}>
          节点过滤工具
        </MainMenu.Item>
        <MainMenu.Item icon={<EditOutlined />} onSelect={() => setShowSelectedShapeActions(!showSelectedShapeActions)}>
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

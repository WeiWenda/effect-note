import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  Children,
  cloneElement,
} from 'react';
import type * as TExcalidraw from '@excalidraw/excalidraw';

import { nanoid } from 'nanoid';

import type { ResolvablePromise } from './utils';
import {
  resolvablePromise,
  distance2d,
  withBatchedUpdates,
  withBatchedUpdatesThrottled, getTextElementsMatchingQuery, filterWithPredicate, filterWithSelectElementId,
} from './utils';

import initialData from './initialData';

import type {
  AppState,
  BinaryFileData,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  Gesture,
  PointerDownState as ExcalidrawPointerDownState,
} from '@excalidraw/excalidraw/types/types';
import type {
  ExcalidrawTextElement,
  NonDeletedExcalidrawElement,
  Theme,
} from '@excalidraw/excalidraw/types/element/types';
import './App.scss';
import {SessionWithToolbarComponent} from '../session';
import {api_utils, DocInfo, InMemory, Path, Session} from '../../share';
import {mimetypeLookup} from '../../ts/util';
import {hasBoundTextElement, isBindableElement, isBoundToContainer, isLinearElement, isTextElement} from './typeChecks';
import {newElementWith, useI18n} from '@excalidraw/excalidraw';
import Draggable from 'react-draggable';
import {Collapse, Tag, Input, Checkbox, Button, Switch, Flex, Space, Tooltip} from 'antd';
import {
  ApartmentOutlined,
  BackwardFilled,
  BackwardOutlined, BranchesOutlined,
  FileSearchOutlined,
  FilterOutlined,
  ForwardFilled, ForwardOutlined,
  FunnelPlotOutlined,
  HolderOutlined, MergeOutlined, NodeIndexOutlined
} from '@ant-design/icons';
const { Panel } = Collapse;
const {Search} = Input;
const CheckboxGroup = Checkbox.Group;
type Comment = {
  x: number;
  y: number;
  value: string;
  id?: string;
};

type PointerDownState = {
  x: number;
  y: number;
  hitElement: Comment;
  onMove: any;
  onUp: any;
  hitElementOffsets: {
    x: number;
    y: number;
  };
};

const COMMENT_ICON_DIMENSION = 32;
const COMMENT_INPUT_HEIGHT = 50;
const COMMENT_INPUT_WIDTH = 150;

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
    sceneCoordsToViewportCoords,
    viewportCoordsToSceneCoords,
    restoreElements,
    Sidebar,
    Footer,
    WelcomeScreen,
    MainMenu,
    LiveCollaborationTrigger,
    convertToExcalidrawElements,
    loadSceneOrLibraryFromBlob,
  } = excalidrawLib;
  const appRef = useRef<any>(null);
  const { t } = useI18n();
  const [selectId, setSelectId] = useState<string>('');
  const [editingTextId, setEditingTextId] = useState<string>('');
  const [boardX, setBoardX] = useState(10);
  const [boardY, setBoardY] = useState(70);
  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [docked, setDocked] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
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

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  useCustom(excalidrawAPI, customArgs);

  useHandleLibrary({ excalidrawAPI });

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
    const fetchData = async () => {
      const res = await fetch('/images/rocket.jpeg');
      const imageData = await res.blob();
      const reader = new FileReader();
      reader.readAsDataURL(imageData);

      reader.onload = function () {
        const imagesArray: BinaryFileData[] = [
          {
            id: 'rocket' as BinaryFileData['id'],
            dataURL: reader.result as BinaryFileData['dataURL'],
            mimeType: MIME_TYPES.jpg,
            created: 1644915140367,
            lastRetrieved: 1644915140367,
          },
        ];

        //@ts-ignore
        initialStatePromiseRef.current.promise.resolve({
          ...initialData,
          elements: initialData.elements,
        });
        excalidrawAPI.addFiles(imagesArray);
      };
    };
    fetchData();
  }, [excalidrawAPI, convertToExcalidrawElements, MIME_TYPES]);

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
          if (!state.openSidebar) {
            saveDocIfNeed();
          }
        },
        onPointerUpdate: (payload: {
          pointer: { x: number; y: number };
          button: 'down' | 'up';
          pointersMap: Gesture['pointers'];
        }) => {
          // if (payload.button === 'down') {
          //   const selectedElements = excalidrawAPI?.getAppState().selectedElementIds;
          //   console.log(selectedElements);
          // }
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
          (showSearch || showFilter) &&
          <Draggable
            defaultClassName={'operation-board'}
            position={{x: boardX, y: boardY}}
            onDrag={(_ , ui) => {
              setBoardX(ui.x);
              setBoardY(ui.y);
            }}
            >
            <div style={{width: '250px'}}>
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
            </div>
          </Draggable>
        }
        <Sidebar name='node-content' className={'excalidraw-node-content'}
                 docked={docked}
                 onDock={(newDocked) => setDocked(newDocked)}>
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
                    elements: filterWithSelectElementId('up_down', excalidrawAPI?.getSceneElements()!, selectId)
                  });
                }}/>
              </Tooltip>
              <Tooltip title={'进入终点子图'} >
                <BranchesOutlined onClick={() => {
                  excalidrawAPI?.updateScene({
                    elements: filterWithSelectElementId('up', excalidrawAPI?.getSceneElements()!, selectId)
                  });
                }} />
              </Tooltip>
              <Tooltip title={'进入起点子图'}>
                <MergeOutlined onClick={() => {
                  excalidrawAPI?.updateScene({
                    elements: filterWithSelectElementId('down', excalidrawAPI?.getSceneElements()!, selectId)
                  });
                }}/>
              </Tooltip>
            </Space>
          </Sidebar.Header>
          <div onMouseEnter={() => {
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

  const updateScene = () => {
    const sceneData = {
      elements: restoreElements(
        convertToExcalidrawElements([
          {
            type: 'rectangle',
            id: 'rect-1',
            fillStyle: 'hachure',
            strokeWidth: 1,
            strokeStyle: 'solid',
            roughness: 1,
            angle: 0,
            x: 100.50390625,
            y: 93.67578125,
            strokeColor: '#c92a2a',
            width: 186.47265625,
            height: 141.9765625,
            seed: 1968410350,
          },
          {
            type: 'arrow',
            x: 300,
            y: 150,
            start: { id: 'rect-1' },
            end: { type: 'ellipse' },
          },
          {
            type: 'text',
            x: 300,
            y: 100,
            text: 'HELLO WORLD!',
          },
        ]),
        null,
      ),
      appState: {
        viewBackgroundColor: '#edf2ff',
      },
    };
    excalidrawAPI?.updateScene(sceneData);
  };
  const saveDocIfNeed = async () => {
    if (editingTextId) {
      console.log(`正在保存内容到节点 ${editingTextId}`);
      session.getCurrentContent(Path.root(), 'application/json').then((content) => {
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
                setEditingTextId('');
                setSelectId(element.id);
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

  const onCopy = async (type: 'png' | 'svg' | 'json') => {
    if (!excalidrawAPI) {
      return false;
    }
    await exportToClipboard({
      elements: excalidrawAPI.getSceneElements(),
      appState: excalidrawAPI.getAppState(),
      files: excalidrawAPI.getFiles(),
      type,
    });
    window.alert(`Copied to clipboard as ${type} successfully`);
  };

  const onPointerDown = (
    activeTool: AppState['activeTool'],
    pointerDownState: ExcalidrawPointerDownState,
  ) => {
    if (activeTool.type === 'selection' && pointerDownState.hit.element) {
      if (hasBoundTextElement(pointerDownState.hit.element) && !isLinearElement(pointerDownState.hit.element)) {
        const textElementId = pointerDownState.hit.element.boundElements?.find(({ type }) => type === 'text');
        const textElement = excalidrawAPI?.getSceneElements().find(e => e.id === textElementId?.id) as ExcalidrawTextElement;
        let content = '';
        try {
           JSON.parse(textElement.originalText);
           content = textElement.originalText;
        } catch (e) {
          // do nothing
          content = '{"text": ""}';
        }
        loadDoc({id: -1, content}).then(() => {
          setTimeout(() => {
            setEditingTextId(textElementId!.id);
            setSelectId(pointerDownState.hit.element!.id);
            excalidrawAPI?.updateScene({appState: {openSidebar: { name: 'node-content'}}});
          });
        });
      }
    }
  };
  const renderMenu = () => {
    return (
      <MainMenu>
        <MainMenu.DefaultItems.LoadScene />
        <MainMenu.DefaultItems.SaveToActiveFile />
        <MainMenu.DefaultItems.Export />
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.Help />
        <MainMenu.DefaultItems.ClearCanvas />
        <MainMenu.Separator />
        <MainMenu.Item icon={<FileSearchOutlined />} onSelect={() => setShowSearch(!showSearch)}>
          节点搜索工具
        </MainMenu.Item>
        <MainMenu.Item icon={<FilterOutlined />} onSelect={() => setShowFilter(!showFilter)}>
          节点过滤工具
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

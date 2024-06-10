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
  withBatchedUpdatesThrottled,
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
  NonDeletedExcalidrawElement,
  Theme,
} from '@excalidraw/excalidraw/types/element/types';
import './App.scss';
import {SessionWithToolbarComponent} from '../session';
import {api_utils, DocInfo, InMemory, Path, Session} from '../../share';
import {mimetypeLookup} from '../../ts/util';

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
  const [curDocId, setCurDocId] = useState(-1);
  const [viewModeEnabled, setViewModeEnabled] = useState(false);
  const [zenModeEnabled, setZenModeEnabled] = useState(false);
  const [gridModeEnabled, setGridModeEnabled] = useState(false);
  const [docked, setDocked] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [disableImageTool, setDisableImageTool] = useState(false);
  const [isCollaborating, setIsCollaborating] = useState(false);
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
          elements: convertToExcalidrawElements(initialData.elements),
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
          console.info('Elements :', elements, 'State : ', state);
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
        <Sidebar name='custom' className={'excalidraw-node-content'}
                 docked={docked}
                 onDock={(newDocked) => setDocked(newDocked)}>
          <Sidebar.Tabs>
            <Sidebar.Header />
            <Sidebar.Tab tab='one'>
              <SessionWithToolbarComponent session={session}
                                           loading={false}
                                           curDocId={-1}
                                           filterOuter={''}
                                           showLayoutIcon={false}
                                           showLockIcon={true}
              />
            </Sidebar.Tab>
            <Sidebar.Tab tab='two'>Tab two!</Sidebar.Tab>
            <Sidebar.TabTriggers>
              <Sidebar.TabTrigger tab='one'>One</Sidebar.TabTrigger>
              <Sidebar.TabTrigger tab='two'>Two</Sidebar.TabTrigger>
            </Sidebar.TabTriggers>
          </Sidebar.Tabs>
        </Sidebar>
        <Sidebar.Trigger
          name='custom'
          tab='one'
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '20px',
            zIndex: 9999999999999999,
          }}
        >
          Toggle Custom Sidebar
        </Sidebar.Trigger>
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

  const loadDoc = async (res: DocInfo) => {
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
    await session.reloadContent(content, mimetypeLookup(res.name!));
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
                console.log('onLinkOpen', docID, viewRoot);
                setCurDocId(docID);
              });
            });
          });
        });
        // do a custom redirect, such as passing to react-router
        // ...
      }
    },
    [],
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
    if (activeTool.type === 'custom' && activeTool.customType === 'comment') {

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

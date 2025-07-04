/*
Initialize the main page.  Rather messy logic for a bunch of stuff:
- handle button clicks (import/export/hotkey stuff)
- handle clipboard paste
- handle errors
- load document from localStorage (fall back to plain in-memory datastructures)
- initialize objects (session, etc.)
- handle rendering logic
*/

import $ from 'jquery';
import * as React from 'react'; // tslint:disable-line no-unused-variable
import {createRoot} from 'react-dom/client';

import 'font-awesome/css/font-awesome.min.css';
import '../assets/css/utils.sass';
import '../assets/css/index.sass';
import '../assets/css/view.sass';
import {
  createBrowserRouter,
  Link,
  Route,
  RouterProvider,
} from 'react-router-dom';
import {message} from 'antd';

import {
  api_utils,
  BackendType,
  browser_utils,
  ClientStore,
  config,
  Document,
  DocumentStore,
  errors,
  IndexedDBBackend,
  InMemory,
  KeyBindings,
  keyDefinitions,
  KeyEmitter,
  KeyHandler,
  KeyMappings,
  Modes,
  Path,
  RegisterTypes,
  SerializedBlock,
  Session,
  SynchronousInMemory,
  SynchronousLocalStorageBackend
} from '../share';
import {SERVER_CONFIG} from '../ts/constants';
// load all plugins
import '../plugins';
import {PluginsManager} from '../ts/plugins';
import logger from '../ts/logger';
import {appendStyleScript} from '../share/ts/themes';
import LayoutComponent, {noteLoader} from './layout';
import YinComponent from './yin';
import {YangComponent} from './yang';
import localforage from 'localforage';
import PkbProducer from './pkb-producer';
import * as ExcalidrawLib from '@weiwenda/excalidraw';

declare const window: any; // because we attach globals for debugging

const appEl = $('#app')[0];

const root = createRoot(appEl);
root.render(
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  }}>
    <div style={{ flexGrow: 3 }}/>
    <div style={{
      textAlign: 'center',
      alignSelf: 'center',
      color: '#999',
    }}>
      <i className='fa fa-5x fa-spin fa-spinner'/>
      <p>Loading... this can take a minute the first time</p>
    </div>
    <div style={{ flexGrow: 8 }}/>
  </div>
);

$(document).ready(async () => {
  // random global state.  these things should be managed by redux maybe
  // let caughtErr: null | Error = null;
  //
  // window.onerror = function(msg: string, url: string, line: number, _col: number, err: Error) {
  //   logger.error(`Caught error: '${msg}' from  ${url}:${line}`);
  //   if (msg === 'ResizeObserver loop limit exceeded') {
  //     // caughtErr = new ExpectedError(msg);
  //   } else if (err) {
  //     logger.error('Error: ', msg, err, err.stack, JSON.stringify(err));
  //     caughtErr = err;
  //   } else {
  //     logger.error('Error: ', msg, JSON.stringify(msg));
  //     caughtErr = new Error(msg);
  //   }
  //   renderMain(); // fire and forget
  // };

  const noLocalStorage = (typeof localStorage === 'undefined' || localStorage === null);
  let clientStore: ClientStore = new ClientStore(new SynchronousLocalStorageBackend());
  let backend_type: BackendType = 'local';
  localforage.setDriver(localforage.LOCALSTORAGE);
  const docname = clientStore.getClientSetting('curDocId').toString();
  let docStore: DocumentStore = new DocumentStore(new IndexedDBBackend(docname), docname);
  let doc;

  // TODO: consider using modernizr for feature detection
  // probably also want to check flexbox support
  // if (noLocalStorage) {
  //   alert('You need local storage support for data to be persisted!');
  //   clientStore = new ClientStore(new SynchronousInMemory());
  //   backend_type = 'inmemory';
  // } else {
  //   clientStore = new ClientStore(new SynchronousLocalStorageBackend());
  //   if (SERVER_CONFIG.socketserver) {
  //     backend_type = 'socketserver';
  //   } else {
  //     backend_type = clientStore.getDocSetting('dataSource');
  //   }
  // }
  //
  // const docname = clientStore.getClientSetting('curDocId').toString();
  //
  // function getLocalStore(): DocumentStore {
  //    return new DocumentStore(new IndexedDBBackend(docname), docname);
  // }
  //
  // if (backend_type === 'inmemory') {
  //   docStore = new DocumentStore(new InMemory());
  // } else {
  //   docStore = getLocalStore();
  //   backend_type = 'local';
  // }

  doc = new Document(docStore, docname);

  // let showingKeyBindings = clientStore.getClientSetting('showKeyBindings');

  // doc.store.events.on('saved', () => {
  //   renderMain(); // fire and forget
  // });
  // doc.store.events.on('unsaved', () => {
  //   renderMain(); // fire and forget
  // });

  // hotkeys and key bindings
  // const saved_mappings = clientStore.getClientSetting('hotkeys');
  // const mappings = KeyMappings.merge(config.defaultMappings, new KeyMappings(saved_mappings));
  const mappings = config.defaultMappings;
  const keyBindings = new KeyBindings(keyDefinitions, mappings);

  function getLineHeight() {
    const line_height = $('.node-text').height() || 21;
    errors.assert(line_height > 0);
    return line_height;
  }

  const session = new Session(clientStore, doc, {
    initialMode: config.defaultMode,
    showMessage: (() => {
      return (messageContent: string, options: {warning?: boolean, time?: number, text_class?: string} = {}) => {
        if (options.warning) {
          message.warning(messageContent, options.time || 1);
        } else {
          message.success(messageContent, options.time || 1);
        }
      };
    })(),
    // toggleBindingsDiv: () => {
    //   showingKeyBindings = !showingKeyBindings;
    //   clientStore.setClientSetting('showKeyBindings', showingKeyBindings);
    //   renderMain(); // fire and forget
    // },
    getLinesPerPage: () => {
      const line_height = getLineHeight();
      const page_height = $(document).height() as number;
      return page_height / line_height;
    },
  });
  session.showBreadCrumbsRootView = true;

  // load plugins

  const pluginManager = new PluginsManager(session, config, keyBindings);
  let enabledPlugins = ['Marks', 'Tags', 'Links', 'HTML', 'Todo', 'Markdown', 'CodeSnippet', 'LaTeX', 'Comment', 'DataLoom', 'Cloze', 'MindMap'];
  if (typeof enabledPlugins.slice === 'undefined') { // for backwards compatibility
    enabledPlugins = Object.keys(enabledPlugins);
  }
  for (let i = 0; i < enabledPlugins.length; i++) {
    const plugin_name = enabledPlugins[i];
    await pluginManager.enable(plugin_name);
  }

  // load data
  // if (to_load !== null) {
  //   await doc.load(to_load);
  //   // a bit hacky.  without this, you can undo initial marks, for example
  //   session.cursor.setPosition(
  //     (await doc.getChildren(viewRoot))[0], 0
  //   );
  //   session.reset_history();
  //   session.reset_jump_history();
  //   await renderMain();
  // }

  const keyHandler = new KeyHandler(session, keyBindings);
  session.keyHandler = keyHandler;
  const keyEmitter = new KeyEmitter();
  session.keyEmitter = keyEmitter;
  // expose globals, for debugging
  window.Modes = Modes;
  window.ExcalidrawLib = ExcalidrawLib;
  window.session = session;
  window.logger = logger;
  window.keyHandler = keyHandler;
  window.keyEmitter = keyEmitter;
  window.keyBindings = keyBindings;
  window.EXCALIDRAW_ASSET_PATH = '/assets';

  const router = createBrowserRouter([
    {
      path: '/',
      element: <LayoutComponent session={session} config={config} pluginManager={pluginManager}/>,
      children: [
        {
          path: 'note/:curDocId',
          element: <YinComponent session={session} pluginManager={pluginManager}/>,
          loader: noteLoader,
        },
        {
          path: 'discovery',
          element: <YangComponent session={session} config={config}/>
        },
        {
          path: 'produce/:curDocId',
          element: <PkbProducer
                                session={session}
                                appTitle={'构建PKB文件'}
                                useCustom={(api: any, args?: any[]) => {}}
                                excalidrawLib={ExcalidrawLib}>
                    <ExcalidrawLib.Excalidraw/>
                  </PkbProducer>,
          loader: noteLoader,
        }
        // {
        //   path: 'test',
        //   element: <DataLoomComponent session={session} row={Path.rootRow()}/>
        // }
      ]
    }
  ]);
  root.render(
    <RouterProvider router={router} />
  );
  const cursorDiv = $('#view .cursor')[0];
  if (cursorDiv) {
    browser_utils.scrollIntoView(cursorDiv, $('#view'), 50);
  }
  // function renderMain() {
  //   console.log('renderMain');
  // }
  // window.renderMain = renderMain;
  appendStyleScript(clientStore);

  session.on('scroll', (numlines) => {
    const line_height = getLineHeight();
    browser_utils.scrollDiv($('#view'), line_height * numlines);
  });

  session.on('changeViewRoot', async (path: Path) => {
    await clientStore.setLastViewRoot(path.getAncestry());
  });

  session.on('yank', (info) => {
    if (clientStore.getClientSetting('copyToClipboard')) {
      let content: string, richContent: string;
      if (info.type === RegisterTypes.CHARS) {
        content = info.saved.join('');
        richContent = info.saved.join('');
      } else if (info.type === RegisterTypes.SERIALIZED_ROWS) {
        const formatted = clientStore.getClientSetting('formattedCopy');
        const contents: Array<string> = [];
        const richContents: Array<string> = ['<ul>'];
        const cache: {[id: number]: SerializedBlock} = {};
        const recurse = (p: any, depth: number) => {
          if (typeof p === 'string') { throw new Error('Expected non-pretty serialization');
          } else if (p.clone) { p = cache[p.clone];
          } else { cache[p.id] = p; } // in case it's cloned

          if (formatted) { contents.push(' '.repeat(depth * 4) + (p.collapsed ? '+ ' : '- ') + p.text);
          } else { contents.push(p.text); }
          richContents.push('<li>' + p.text + '</li>');

          if (p.collapsed || !p.children) { return; }
          richContents.push('<ul>');
          p.children.forEach((child: SerializedBlock) => recurse(child, depth + 1));
          richContents.push('</ul>');
        };
        info.saved.forEach((p: SerializedBlock) => recurse(p, 0));
        content = contents.join('\n');
        richContents.push('</ul>');
        if (contents.length <= 1) { richContent = content; } else {
          richContent = richContents.join('\n');
        }
      } else if (info.type === RegisterTypes.CLONED_ROWS) {
        // For now, this does not copy, for efficiency reasons
        return;
      } else {
        throw Error(`Unexpected yank with invalid info ${info}`);
      }

      copyToClipboard(content, richContent);
      // session.showMessage('Copied to clipboard!'
      //   + (content.length > 10 ? content.substr(0, 10) + '...' : content));
    }
  });

  keyEmitter.listen();
  keyEmitter.on('keydown', (key) => {
    if (!session.stopMonitor) {
      keyHandler.queueKey(key);
      // NOTE: this is just a best guess... e.g. the mode could be wrong
      // problem is that we process asynchronously, but need to return synchronously
      if (window.navigator.platform.startsWith('Mac')) {
        return keyBindings.bindings[session.mode].getKey(key) != null ||
          (session.mode === 'INSERT' && (key === 'space' || 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.includes(key)));
      } else {
        return keyBindings.bindings[session.mode].getKey(key) != null ||
            (session.mode === 'INSERT' && (key === 'space' || key.length === 1));
      }
    } else {
      return false;
    }
  });

  keyHandler.on('handledKey', () => {
    session.emit('updateAnyway');
  });

  window.addEventListener('blur', () => {
    // 从其他应用复制链接的情况
    if (!session.selectPopoverOpen) {
      session.cursor.reset();
      session.markSelecting(false, 'window-blur');
    }
    session.register.saveNone();
    session.emit('updateInner');
  });

  $(window).on('unload', () => {
    session.exit(); // fire and forget
  });
});

export function copyToClipboard(text: string, richText?: string) {
  // https://stackoverflow.com/a/33928558/5937230

  // https://stackoverflow.com/questions/23934656/javascript-copy-rich-text-contents-to-clipboard
  function listener(e: ClipboardEvent) {
    if (!e.clipboardData) {
      return;
    }
    if (richText) {
      e.clipboardData.setData('text/html', richText);
    }
    e.clipboardData.setData('text/plain', text);
    e.preventDefault();
  }

  if (window.clipboardData && window.clipboardData.setData) {
    // IE specific code path to prevent textarea being shown while dialog is visible.
    return window.clipboardData.setData('Text', text);
  } else if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
    const textarea = document.createElement('textarea');
    textarea.textContent = text;
    textarea.style.position = 'fixed';  // Prevent scrolling to bottom of page in MS Edge.
    document.body.appendChild(textarea);
    textarea.select();


    try {
      document.addEventListener('copy', listener);
      return document.execCommand('copy');  // Security exception may be thrown by some browsers.
    } catch (ex) {
      console.warn('Copy to clipboard failed.', ex);
      return false;
    } finally {
      document.body.removeChild(textarea);
      document.removeEventListener('copy', listener);
    }
  }
  return false;
}

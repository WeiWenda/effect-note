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
import { message } from 'antd';

import {
  browser_utils, errors, SerializedBlock, Modes, RegisterTypes,
  KeyEmitter, KeyHandler, KeyMappings, KeyBindings, ClientStore, DocumentStore,
  SynchronousInMemory, InMemory, BackendType, SynchronousLocalStorageBackend,
  ClientSocketBackend, IndexedDBBackend, Document, Path, Session,
  config, keyDefinitions, api_utils
} from '../share';
import { SERVER_CONFIG } from '../ts/constants';
// load all plugins
import '../plugins';
import YinComponent from './yin';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';
import {PluginsManager} from '../ts/plugins';
import logger from '../ts/logger';
import {appendStyleScript} from '../share/ts/themes';
import LayoutComponent from './layout';

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
  let docname = localStorage.getItem('currentDocId') || '';
  // random global state.  these things should be managed by redux maybe
  let caughtErr: null | Error = null;

  window.onerror = function(msg: string, url: string, line: number, _col: number, err: Error) {
    logger.error(`Caught error: '${msg}' from  ${url}:${line}`);
    if (msg === 'ResizeObserver loop limit exceeded') {
      // caughtErr = new ExpectedError(msg);
    } else if (err) {
      logger.error('Error: ', msg, err, err.stack, JSON.stringify(err));
      caughtErr = err;
    } else {
      logger.error('Error: ', msg, JSON.stringify(msg));
      caughtErr = new Error(msg);
    }
    renderMain(); // fire and forget
  };

  const noLocalStorage = (typeof localStorage === 'undefined' || localStorage === null);
  let clientStore: ClientStore;
  let docStore: DocumentStore;
  let backend_type: BackendType;
  let doc;

  // TODO: consider using modernizr for feature detection
  // probably also want to check flexbox support
  if (noLocalStorage) {
    alert('You need local storage support for data to be persisted!');
    clientStore = new ClientStore(new SynchronousInMemory());
    backend_type = 'inmemory';
  } else {
    clientStore = new ClientStore(new SynchronousLocalStorageBackend(), docname);
    if (SERVER_CONFIG.socketserver) {
      backend_type = 'socketserver';
    } else {
      backend_type = clientStore.getDocSetting('dataSource');
    }
  }

  function getLocalStore(): DocumentStore {
     return new DocumentStore(new IndexedDBBackend(docname), docname);
  }

  async function getSocketServerStore(): Promise<DocumentStore> {
    let socketServerHost;
    let socketServerDocument;
    let socketServerPassword;
    if (SERVER_CONFIG.socketserver) { // server is fixed!
      socketServerHost = window.location.origin.replace(/^http/, 'ws');
      socketServerDocument = docname;
      socketServerPassword = clientStore.getDocSetting('socketServerPassword');
    } else {
      socketServerHost = clientStore.getDocSetting('socketServerHost');
      socketServerDocument = clientStore.getDocSetting('socketServerDocument');
      socketServerPassword = clientStore.getDocSetting('socketServerPassword');
    }

    if (!socketServerHost) {
      throw new Error('No socket server host found');
    }
    const socket_backend = new ClientSocketBackend();
    // NOTE: we don't pass docname to DocumentStore since we want keys
    // to not have prefixes
    const dStore = new DocumentStore(socket_backend);
    while (true) {
      try {
        await socket_backend.init(
          socketServerHost, socketServerPassword || '', socketServerDocument || '');
        break;
      } catch (e) {
        if (e === 'Wrong password!') {
          socketServerPassword = prompt(
            socketServerPassword ?
              'Password incorrect!  Please try again: ' :
              'Please enter the password',
            '');
        } else {
          throw e;
        }
      }
    }
    clientStore.setDocSetting('socketServerPassword', socketServerPassword);
    logger.info(`Successfully initialized socked connection: ${socketServerHost}`);
    return dStore;
  }

  if (backend_type === 'inmemory') {
    docStore = new DocumentStore(new InMemory());
  } else if (backend_type === 'socketserver') {
    try {
      docStore = await getSocketServerStore();
    } catch (e: any) {
      alert(`
        Error loading socket server datastore:

        ${e.message}

        ${e.stack}

        Falling back to localStorage default.
      `);

      clientStore.setDocSetting('socketServerPassword', '');
      docStore = getLocalStore();
      backend_type = 'local';
    }
  } else {
    docStore = getLocalStore();
    backend_type = 'local';
  }

  doc = new Document(docStore, docname);

  let to_load: any = null;
  // if ((await docStore.getChildren(Path.rootRow())).length === 0 && docname === '') {
  //   to_load = config.getDefaultData();
  // }

  let showingKeyBindings = clientStore.getClientSetting('showKeyBindings');

  doc.store.events.on('saved', () => {
    renderMain(); // fire and forget
  });
  doc.store.events.on('unsaved', () => {
    renderMain(); // fire and forget
  });

  // hotkeys and key bindings
  const saved_mappings = clientStore.getClientSetting('hotkeys');
  const mappings = KeyMappings.merge(config.defaultMappings, new KeyMappings(saved_mappings));
  const keyBindings = new KeyBindings(keyDefinitions, mappings);

  // session
  // if (!await doc.hasChildren(doc.root.row)) {
  //   // HACKY: should load the actual data now, but since plugins aren't enabled...
  //   await doc.loadEmpty();
  // }

  let viewRoot;
  if (window.location.hash.length > 1) {
    try {
      const row = parseInt(window.location.hash.slice(1), 10);
      if (await doc.isAttached(row)) {
        viewRoot = await doc.canonicalPath(row);
      }
    } catch (e) {
      logger.error(`Invalid hash: ${window.location.hash}`);
    }
  }
  if (!viewRoot) {
    viewRoot = Path.loadFromAncestry(await clientStore.getLastViewRoot());
  }
  let cursorPath = viewRoot;
  // if (viewRoot.isRoot() || !await doc.isValidPath(viewRoot)) {
  //   viewRoot = Path.root();
  //   cursorPath = (await doc.getChildren(viewRoot))[0];
  //   window.location.hash = '';
  // } else {
  //   cursorPath = viewRoot;
  // }

  function getLineHeight() {
    const line_height = $('.node-text').height() || 21;
    errors.assert(line_height > 0);
    return line_height;
  }

  const session = new Session(clientStore, doc, {
    initialMode: config.defaultMode,
    viewRoot: viewRoot,
    cursorPath: cursorPath,
    showMessage: (() => {
      return (messageContent: string, options: {time?: number, text_class?: string} = {}) => {
        message.success(messageContent, options.time || 1);
      };
    })(),
    toggleBindingsDiv: () => {
      showingKeyBindings = !showingKeyBindings;
      clientStore.setClientSetting('showKeyBindings', showingKeyBindings);
      renderMain(); // fire and forget
    },
    getLinesPerPage: () => {
      const line_height = getLineHeight();
      const page_height = $(document).height() as number;
      return page_height / line_height;
    },
  });
  session.showBreadCrumbsRootView = true;

  // load plugins

  const pluginManager = new PluginsManager(session, config, keyBindings);
  let enabledPlugins = await docStore.getSetting('enabledPlugins');
  if (typeof enabledPlugins.slice === 'undefined') { // for backwards compatibility
    enabledPlugins = Object.keys(enabledPlugins);
  }
  for (let i = 0; i < enabledPlugins.length; i++) {
    const plugin_name = enabledPlugins[i];
    await pluginManager.enable(plugin_name);
  }

  // load data
  if (to_load !== null) {
    await doc.load(to_load);
    // a bit hacky.  without this, you can undo initial marks, for example
    session.cursor.setPosition(
      (await doc.getChildren(viewRoot))[0], 0
    );
    session.reset_history();
    session.reset_jump_history();
    await renderMain();
  }

  const keyHandler = new KeyHandler(session, keyBindings);
  const keyEmitter = new KeyEmitter();

  // expose globals, for debugging
  window.Modes = Modes;
  window.session = session;
  window.logger = logger;
  window.keyHandler = keyHandler;
  window.keyEmitter = keyEmitter;
  window.keyBindings = keyBindings;

  function renderMain() {
    root.render(
      <LayoutComponent session={session} config={config} pluginManager={pluginManager}/>
      // <Router>
      //   <Routes>
      //     <Route path='/yin' element={
      //       <AppComponent
      //         error={caughtErr}
      //         message={userMessage}
      //         saveMessage={saveMessage}
      //         config={config}
      //         session={session}
      //         pluginManager={pluginManager}
      //         showFileList={true}
      //         showingKeyBindings={showingKeyBindings}
      //         keyBindings={keyBindings}
      //         initialBackendType={backend_type}
      //       />
      //     }/>
      //     <Route path='/' element={
      //
      //     }/>
      //   </Routes>
      // </Router>
    );
    const cursorDiv = $('#view .cursor')[0];
    if (cursorDiv) {
      browser_utils.scrollIntoView(cursorDiv, $('#view'), 50);
    }
  }
  window.renderMain = renderMain;

  await api_utils.getCurrentUserDocs().then(res => {
    session.userDocs = res.content;
  });
  await renderMain();
  appendStyleScript(clientStore);

  session.on('scroll', (numlines) => {
    const line_height = getLineHeight();
    browser_utils.scrollDiv($('#view'), line_height * numlines);
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

  session.on('importFinished', renderMain); // fire and forget

  session.on('changeViewRoot', async (path: Path) => {
    await clientStore.setLastViewRoot(path.getAncestry());
    window.location.hash = `#${path.row}`;
  });

  keyEmitter.listen();
  keyEmitter.on('keydown', (key) => {
    if (!session.stopMonitor) {
      keyHandler.queueKey(key);
      // NOTE: this is just a best guess... e.g. the mode could be wrong
      // problem is that we process asynchronously, but need to return synchronously
      return keyBindings.bindings[session.mode].getKey(key) != null ||
        (session.mode === 'INSERT' && (key === 'space' || 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.includes(key)));
    } else {
      return false;
    }
  });

  keyHandler.on('handledKey', renderMain); // fire and forget

  session.on('modeChange', renderMain); // fire and forget

  session.on('updateAnyway', renderMain);

  keyBindings.on('applied_hotkey_settings', (hotkey_settings) => {
    clientStore.setClientSetting('hotkeys', hotkey_settings);
    renderMain(); // fire and forget
  });

  pluginManager.on('status', renderMain); // fire and forget

  pluginManager.on('enabledPluginsChange', function(enabled) {
    docStore.setSetting('enabledPlugins', enabled);
    renderMain(); // fire and forget
  });

  // needed for safari
  // const $pasteHack = $('#paste-hack');
  // $pasteHack.focus();
  $(document).on('click', function(e) {
    if (e.detail === 2 && session.mode === 'NORMAL') {
      session.setMode('INSERT');
    }
    // if settings menu is up, we don't want to blur (the dropdowns need focus)
    if (session.mode === 'SETTINGS') { return; }
    // if user is trying to copy, we don't want to blur
    if (window.getSelection().toString()) { return; }
    // $pasteHack.focus();
  });

  $(document).on('paste', async (e) => {
    if (session.mode === 'SETTINGS') { return; }

    if (session.stopMonitor) { return; }

    e.preventDefault();
    let text: string = ((e.originalEvent || e) as any).clipboardData.getData('text/plain');
    text = text.replace(/(?:\r)/g, '');  // Remove \r (Carriage Return) from each line
    await keyHandler.queue(async () => {
      // TODO: deal with this better when there are multiple lines
      // maybe put in insert mode?
      session.pasteText(text);
    });
    renderMain(); // fire and forget
  });

  $(window).on('unload', () => {
    session.exit(); // fire and forget
  });

  // NOTE: problem is that this is very slow!
  //   Also, to make it work, needs bluebird
  // (Promise as any).onPossiblyUnhandledRejection(function(error) {
  //   throw error;
  // });
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

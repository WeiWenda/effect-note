import keyDefinitions, {Action, SequenceAction} from '../keyDefinitions';
import {IndexedDBBackend, Path} from '../index';
keyDefinitions.registerAction(new Action(
  'save-cloud',
  'Persist to cloud',
  async function({ session }) {
    session.reUploadFile(Path.root(), session.clientStore.getClientSetting('curDocId')).then(docId => {
      if (docId !== undefined) {
        session.emit('save-cloud', {docId: docId});
      } else {
        session.showMessage('正在保存，请勿重复保存');
      }
    });
  },
  {
    sequence: SequenceAction.DROP,
  },
));

keyDefinitions.registerAction(new Action(
  'unfold-node',
  'Persist to cloud',
  async function({ session, keyStream }) {
    keyStream.save();
    const key = keyStream.lastSequence.pop();
    switch (key) {
      case '1':
      case '2':
      case '3':
        await session.foldBlock(session.cursor.path, Number(key), false);
        break;
      case 'a':
        await session.foldBlock(session.cursor.path, 100, false);
        break;
      case '0':
        await session.foldBlock(session.cursor.path, 100, true);
        break;
      default:
    }
    session.setMode('INSERT');
  }
));

keyDefinitions.registerAction(new Action(
  'open-markdown',
  'Persist to cloud',
  async function({ session }) {
    const rowInfo = (await session.document.getInfo(session.cursor.row)).info;
    session.emit('openModal', 'md', {'md': rowInfo.pluginData.links.md || rowInfo.line.slice(0, -1).join('')});
    session.mdEditorOnSave = (markdown: string, _html: string) => {
      session.emitAsync('setMarkdown', session.cursor.row, markdown).then(() => {
        session.emit('updateAnyway');
      });
    };
    session.setMode('INSERT');
  },
  {
    sequence: SequenceAction.DROP,
  },
));

keyDefinitions.registerAction(new Action(
  'open-html',
  'Persist to cloud',
  async function({ session }) {
    const rowInfo = (await session.document.getInfo(session.cursor.row)).info;
    let html: string = rowInfo.line.slice(0, -1).join('');
    if (rowInfo.line.join('').startsWith('<div class=\'node-html\'>')) {
      html = rowInfo.line.join('').slice('<div class=\'node-html\'>'.length, -6);
    }
    session.emit('openModal', 'rtf', {html});
    session.wangEditorOnSave = (content: any) => {
      let wrappedHtml = `<div class='node-html'>${content}</div>`;
      session.changeChars(session.cursor.row, 0, rowInfo.line.length,
        (_ ) => wrappedHtml.split('')).then(() => {
        session.emit('updateAnyway');
      });
    };
    session.setMode('INSERT');
  },
  {
    sequence: SequenceAction.DROP,
  },
));

keyDefinitions.registerAction(new Action(
  'open-drawio',
  'Persist to cloud',
  async function({ session }) {
    session.emit('setDrawio', session.cursor.row);
    session.setMode('INSERT');
  },
  {
    sequence: SequenceAction.DROP,
  },
));

keyDefinitions.registerAction(new Action(
  'open-mindmap',
  'Persist to cloud',
  async function({ session }) {
    session.emit('openModal', 'png');
    session.pngOnSave = (img_src: any, img_json: any) => {
      session.emitAsync('setMindmap', session.cursor.row, img_src, img_json).then(() => {
        session.emit('updateAnyway');
      });
    };
    setTimeout(() => {
      session.getKityMinderNode(session.cursor.path).then(kmnode => {
        session.mindMapRef.current.setContent(kmnode);
      });
    }, 1000);
    session.setMode('INSERT');
  },
  {
    sequence: SequenceAction.DROP,
  },
));

keyDefinitions.registerAction(new Action(
  'mark-mark',
  'Persist to cloud',
  async function({ session }) {
    session.setMode('INSERT');
    const rowInfo = (await session.document.getInfo(session.cursor.row)).info;
    session.emit('setMark', session.cursor.row, rowInfo.line.join(''));
  },
  {
    sequence: SequenceAction.DROP,
  },
));

keyDefinitions.registerAction(new Action(
  'mark-tag',
  'Persist to cloud',
  async function({ session }) {
    session.emit('startTag', session.cursor.path);
    await session.document.updateCachedPluginData(session.cursor.row);
    session.setMode('INSERT');
  },
  {
    sequence: SequenceAction.DROP,
  },
));

keyDefinitions.registerAction(new Action(
  'refresh',
  'Persist to cloud',
  async function({ session }) {
    const indexDB = session.document.store.backend as IndexedDBBackend;
    indexDB.getLastSave().then(() => {
      session.showMessage('正在刷新');
      window.location.reload();
    });
  },
  {
    sequence: SequenceAction.DROP,
  },
));

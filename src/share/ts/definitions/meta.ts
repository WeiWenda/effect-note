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
  'refresh',
  'Persist to cloud',
  async function({ session }) {
    const indexDB = session.document.store.backend as IndexedDBBackend;
    if (session.document.store.isBusy()) {
      session.showMessage('正在加载，请勿刷新');
    } else {
      session.showMessage('正在刷新');
      window.location.reload();
    }
  },
  {
    sequence: SequenceAction.DROP,
  },
));

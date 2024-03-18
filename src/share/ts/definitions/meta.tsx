import keyDefinitions, {Action, SequenceAction} from '../keyDefinitions';
import {IndexedDBBackend, Path} from '../index';
import {notification} from 'antd';
keyDefinitions.registerAction(new Action(
  'start-tag',
  'starting tag',
  async function({ session }) {
    await session.emitAsync('startTag', session.cursor.path);
  }
));

keyDefinitions.registerAction(new Action(
  'save-cloud',
  'Persist to cloud',
  async function({ session }) {
    session.reUploadFile(Path.root(), session.clientStore.getClientSetting('curDocId')).then(docId => {
      if (docId !== undefined) {
        session.emitAsync('save-cloud', {docId: docId}).then(() => {
          session.showMessage('保存成功');
        });
      } else {
        session.showMessage('正在保存，请勿重复保存');
      }
    }).catch(e => {
      if (e.toString().includes('Push rejected because it was not a simple fast-forward. Use "force: true" to override.')) {
        notification.error({message: '保存失败', description: (
            <>
              内容冲突，请重新加载当前文档！
            </>), placement: 'bottomRight'});
      } else {
          notification.error({message: '保存失败', description: e.toString(), placement: 'bottomRight'});
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

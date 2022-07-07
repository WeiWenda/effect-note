import keyDefinitions, {Action, SequenceAction} from '../keyDefinitions';
import {Path} from '../index';
keyDefinitions.registerAction(new Action(
  'save-cloud',
  'Persist to cloud',
  async function({ session }) {
    session.reUploadFile(Path.root(), Number(localStorage.getItem('currentDocId'))).then(docId => {
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

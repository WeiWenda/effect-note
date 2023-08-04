import * as _ from 'lodash';

import './index.sass';

import { Session, Row, hideBorderAndModify, RegexTokenizerModifier } from '../../share';
import { registerPlugin } from '../../ts/plugins';
import { matchWordRegex } from '../../ts/text';
import {pluginName as tagsPluginName, TagsPlugin} from '../tags';
import Moment from 'moment';
import {getTaskStatus} from '../links/dropdownMenu';

const strikethroughClass = 'strikethrough';

export const pluginName = 'Todo';

export function struckThroughHook(tokenizer: any) {
  return tokenizer.then(RegexTokenizerModifier(
    matchWordRegex('\\~\\~(\\n|.)+?\\~\\~'),
    hideBorderAndModify(2, 2, (char_info) => { char_info.renderOptions.classes[strikethroughClass] = true; })
  ));
}

registerPlugin(
  {
    name: pluginName,
    author: 'Jeff Wu',
    description: `Lets you strike out bullets (by default with ctrl+enter)`,
    dependencies: [tagsPluginName],
  },
  function(api) {
    api.registerHook('session', 'renderLineTokenHook', struckThroughHook);

    async function isStruckThrough(session: Session, row: Row) {
      // for backwards compatibility
      const isStruckThroughOldStyle = await session.document.store._isStruckThroughOldFormat(row);
      if (isStruckThroughOldStyle) { return true; }

      const text = await session.document.getText(row);
      return (text.slice(0, 2) === '~~') && (text.slice(-2) === '~~');
    }

    async function addStrikeThrough(session: Session, row: Row) {
      await session.addChars(row, -1, ['~', '~']);
      await session.addChars(row, 0, ['~', '~']);
    }

    async function removeStrikeThrough(session: Session, row: Row) {
      await session.delChars(row, -2, 2);
      await session.delChars(row, 0, 2);
    }

    api.registerAction(
      'toggle-strikethrough',
      'Toggle strikethrough for a row',
      async function({ session }) {
        const tagsPlugin = api.getPlugin(tagsPluginName) as TagsPlugin;
        const existTags = await tagsPlugin.getTags(session.cursor.row);
        let filteredTags = existTags?.filter(t => !t.startsWith('end: '))
          .filter((t: string) => !['Delay', 'Done', 'Todo', 'Doing'].includes(t)) || [];
        if (await isStruckThrough(session, session.cursor.row)) {
          const taskStatus = getTaskStatus(filteredTags);
          if (taskStatus) {
            filteredTags = [taskStatus, ...filteredTags];
          }
          await tagsPlugin.setTags(session.cursor.row, filteredTags);
          await removeStrikeThrough(session, session.cursor.row);
        } else {
          filteredTags = ['end: ' + Moment().format('yyyy-MM-DD HH:mm:ss'),  ...filteredTags];
          filteredTags = [getTaskStatus(filteredTags)!, ...filteredTags];
          await tagsPlugin.setTags(session.cursor.row, filteredTags);
          await addStrikeThrough(session, session.cursor.row);
        }
      },
    );

    // TODO: this should maybe strikethrough children, since UI suggests it?
    api.registerAction(
      'visual-line-toggle-strikethrough',
      'Toggle strikethrough for rows',
      async function({ session, visual_line }) {
        if (visual_line == null) {
          throw new Error('Visual_line mode arguments missing');
        }

        const is_struckthrough = await Promise.all(
          visual_line.selected.map(async (path) => {
            return await isStruckThrough(session, path.row);
          })
        );
        if (_.every(is_struckthrough)) {
          await Promise.all(
            visual_line.selected.map(async (path) => {
              await removeStrikeThrough(session, path.row);
            })
          );
        } else {
          await Promise.all(
            visual_line.selected.map(async (path, i) => {
              if (!is_struckthrough[i]) {
                await addStrikeThrough(session, path.row);
              }
            })
          );
        }
        await session.setMode('NORMAL');
      },
    );

    api.registerDefaultMappings(
      'NORMAL',
      {
        'toggle-strikethrough': [['ctrl+enter']],
      },
    );

    api.registerDefaultMappings(
      'INSERT',
      {
        'toggle-strikethrough': [['ctrl+enter'], ['meta+enter']],
      },
    );

    api.registerDefaultMappings(
      'VISUAL_LINE',
      {
        'visual-line-toggle-strikethrough': [['ctrl+enter']],
      },
    );

    // TODO for workflowy mode
    // NOTE: in workflowy, this also crosses out children
    // 'toggle-strikethrough': [['meta+enter']],
  },
  (api => api.deregisterAll()),
);

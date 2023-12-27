import * as _ from 'lodash';
import * as React from 'react'; // tslint:disable-line no-unused-variable
import ical from 'ical-generator';
import {
  Char,
  Document,
  errors,
  InMemorySession,
  INSERT_MOTION_MAPPINGS,
  LineComponent,
  Menu,
  motionKey,
  Mutation,
  Path,
  Row,
  Session,
  SINGLE_LINE_MOTIONS
} from '../../share';
import {PluginApi, registerPlugin} from '../../ts/plugins';
import {Logger} from '../../ts/logger';
import {getStyles} from '../../share/ts/themes';
import {Popover, Select, Tag} from 'antd';
import type { CustomTagProps } from 'rc-select/lib/BaseSelect';
import Moment from 'moment';
import {onlyUnique} from '../../ts/util';
import {TaskMenuComponent} from './taskMenu';
const { Option } = Select;

// TODO: do this elsewhere
declare const process: any;

type Tag = string;
type Tags = Tag[];
type Rows = Row[];
type TagsToRows = {[key: string]: Rows};
type RowsToTags = {[key: number]: Tags};

const colorMap: Record<string, string> = {
  'Delay': 'error',
  'Done': 'success',
  'Todo': 'warning',
  'Doing': 'processing',
  '关键': 'error',
  '重要': 'warning',
  '注意': 'processing'
};
const tagRender = (props: CustomTagProps) => {
  const { label, value, closable, onClose } = props;
  return (
    <Tag
      color={colorMap[label as string] || 'default'}
    >
      {label}
    </Tag>
  );
};

/*
 * ALGORITHMIC NOTE: maintaining the set of tags
 * Rather than trying to update the list
 * as rows get removed and added from the document (which is especially
 * tricky because of cloning),
 * we simply store all tags, even if attached to the document,
 * and then prune after looking them up.
 */

export class TagsPlugin {
  private api: PluginApi;
  private logger: Logger;
  private session: Session;
  private document: Document;
  private tags: Tag[];
  public tagstate: {
    session: Session,
    path: Path,
  } | null = null;
  // hacky, these are only used when enabled
  public SetTag!: new(row: Row, tag: Tag) => Mutation;
  public UnsetTag!: new(row: Row, tag: Tag) => Mutation;

  constructor(api: PluginApi) {
    this.api = api;
    this.logger = this.api.logger;
    this.session = this.api.session;
    this.document = this.session.document;
    this.tags = [];
    // NOTE: this may not be initialized correctly at first
    // this only affects rendering @taglinks for now
  }

  public async enable() {
    const that = this;
    this.logger.debug('Enabling tags');

    class SetTag extends Mutation {
      private row: Row;
      private tag: Tag;
      private undo: boolean;

      constructor(row: Row, tag: Tag, undo = false) {
        super();
        this.row = row;
        this.tag = tag;
        this.undo = undo;
      }
      public str() {
        return `row ${this.row}, tag ${this.tag}`;
      }
      public async mutate(/* session */) {
        await that._setTag(this.row, this.tag);
        await that.api.updatedDataForRender(this.row);
        if (!this.undo) {
          await that.document.applyHookAsync('tagAdded', {}, { tag: this.tag, row: this.row });
        }
      }
      public async rewind(/* session */) {
        return [
          new UnsetTag(this.row, this.tag, true),
        ];
      }
    }
    this.SetTag = SetTag;

    class UnsetTag extends Mutation {
      private row: Row;
      private tag: Tag;
      private undo: boolean;

      constructor(row: Row, tag: Tag, undo = false) {
        super();
        this.row = row;
        this.tag = tag;
        this.undo = undo;
      }
      public str() {
        return `row ${this.row}, tag ${this.tag}`;
      }
      public async mutate(/* session */) {
        const tags = await that.getTags(this.row);
        if (tags !== null && tags.includes(this.tag)) {
          await that._unsetTag(this.row, this.tag);
          await that.api.updatedDataForRender(this.row);
          if (!this.undo) {
            await that.document.applyHookAsync('tagRemoved', {}, { tag: this.tag, row: this.row });
          }
        }
      }
      public async rewind(/* session */) {
        return [
          new SetTag(this.row, this.tag, true),
        ];
      }
    }
    this.UnsetTag = UnsetTag;

    this.api.registerListener('session', 'startTag', async (path: Path) => {
      this.tagstate = {
        session: new InMemorySession(),
        path: path
      };
      await this.session.document.updateCachedPluginData(path.row);
    });
    this.api.registerListener('session', 'clearPluginStatus', async () => {
      await this.clearTags();
    });
    this.api.registerListener('session', 'markTask', async (path: Path) => {
      const tags = await this.getTags(path.row);
      if (tags === null ||  tags.every((t: string) => !['Delay', 'Done', 'Todo', 'Doing'].includes(t))) {
          await this.setTags(path.row, ['Todo', ...(tags || [])]);
      }
    });
    // Serialization #

    this.api.registerHook('document', 'serializeRow', async (struct, info) => {
      const tags = await this.getTags(info.row);
      if (tags) {
        struct.tags = tags;
      }
      return struct;
    });

    this.api.registerListener('document', 'loadRow', async (path, serialized) => {
      if (serialized.tags != null) {
        const err = await this.setTags(path.row, serialized.tags);
        if (err) { return this.session.showMessage(err, {text_class: 'error'}); }
      }
    });

    // Commands #

    this.tagstate = null;

    this.api.registerHook('document', 'pluginRowContents', async (obj, { row }) => {
      const tags = await this.getTags(row);
      const tagging = this.tagstate && (this.tagstate.path.row === row);
      obj.tags = { tags, tagging };
      if (this.tagstate && tagging) {
        obj.tags.tagText = await this.tagstate.session.document.getLine(
          this.tagstate.session.cursor.path.row
        );
        obj.tags.tagCol = this.tagstate.session.cursor.col;
      }
      return obj;
    });

    this.api.registerHook('session', 'renderLineOptions', (options, info) => {
      if (info.pluginData.tags && info.pluginData.tags.tagging) {
        options.cursors = {};
      }
      return options;
    });

    this.api.registerHook('session', 'renderLineContents', (lineContents, info) => {
      const { path, pluginData } = info;
      let tags: string[] = pluginData.tags?.tags || [];
      const taskTags = tags
        .filter((t: string) => new RegExp('((create|start|end|due):.*)').test(t) || ['Todo', 'Done'].includes(t));
      tags = tags
        .filter((t: string) => !new RegExp('((create|start|end|due):.*)').test(t))
        .filter((t: string) => !['Todo', 'Done'].includes(t));
      if (tags.length > 0 || pluginData.tags?.tagging) {
        const options: any[] = this.tags
          .filter((t: string) => !new RegExp('(create|start|end|due):.*').test(t))
          .filter((t: string) => !['Delay', 'Done', 'Todo', 'Doing'].includes(t))
          .concat(['重要', '关键', '注意']).filter( onlyUnique )
          .map(tag => { return {label: tag, value: tag}; });
        const handleChange = (newTags: string[]) => {
          this.setTags(path.row, newTags.concat(taskTags));
        };
        lineContents.push(
          <Select
                  defaultOpen={pluginData.tags?.tagging}
                  key='tags'
                  mode='tags'
                  value={tags}
                  suffixIcon={<div/>}
                  tagRender={tagRender}
                  options={options}
                  autoFocus={pluginData.tags?.tagging}
                  onFocus={() => this.session.stopKeyMonitor('tag-normal')}
                  onDropdownVisibleChange={(open) => {
                    if (!open) {
                      this.session.startKeyMonitor();
                      this.tagstate = null;
                      this.api.updatedDataForRender(path.row).then(() => {
                        this.session.emit('updateInner');
                      });
                    }
                  }}
                  onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                  }}
                  bordered={false} style={{
                    marginLeft: '5px', minWidth: '80px', width: 'auto' }} placeholder='添加标签' onChange={handleChange}>
          </Select>
        );
      }
      return lineContents;
    });
  }

  // maintain global tags data structures
  //   a map: row -> tags
  //   and a second map: tag -> rows
  public async _getRowsToTags(): Promise<RowsToTags> {
    return await this.api.getData('ids_to_tags', {});
  }
  private async _setRowsToTags(rows_to_tags: RowsToTags) {
    return await this.api.setData('ids_to_tags', rows_to_tags);
  }
  public async _getTagsToRows(): Promise<TagsToRows> {
    return await this.api.getData('tags_to_ids', {});
  }
  private async _setTagsToRows(tag_to_rows: TagsToRows) {
    this.tags = Object.keys(tag_to_rows);
    return await this.api.setData('tags_to_ids', tag_to_rows);
  }

  private async _sanityCheckTags() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    const [
      tags_to_rows,
      rows_to_tags,
    ] = await Promise.all([
      this._getTagsToRows(),
      this._getRowsToTags(),
    ]);
    const tags_to_rows2: TagsToRows = {};
    for (const row in rows_to_tags) {
      const tags = rows_to_tags[row];
      errors.assert(tags.length === new Set(tags).size);
      for (let tag of tags) {
        if (!tags_to_rows2[tag]) {
          tags_to_rows2[tag] = [];
        }
        tags_to_rows2[tag].push(parseInt(row, 10));
      }
    }
    for (const tag in tags_to_rows) {
      tags_to_rows[tag].sort();
      tags_to_rows2[tag].sort();
      errors.assert(tags_to_rows[tag].length === new Set(tags_to_rows[tag]).size);
    }
    errors.assert_deep_equals(tags_to_rows, tags_to_rows2, 'Inconsistent rows_to_tags');
  }

  // get tag for an row, '' if it doesn't exist
  public async getTags(row: Row): Promise<Tags | null> {
    const tags = await this._getRowsToTags();
    return tags[row] || null;
  }

  private async _setTag(row: Row, tag: Tag) {
    await this._sanityCheckTags();
    const tags_to_rows = await this._getTagsToRows();
    const rows_to_tags = await this._getRowsToTags();
    errors.assert(!tags_to_rows.hasOwnProperty(tag) || !tags_to_rows[tag].includes(row));
    errors.assert(!rows_to_tags.hasOwnProperty(row) || !rows_to_tags[row].includes(tag));
    if (!tags_to_rows[tag]) {
      tags_to_rows[tag] = [];
    }
    if (!rows_to_tags[row]) {
      rows_to_tags[row] = [];
    }
    tags_to_rows[tag].push(row);
    rows_to_tags[row].push(tag);
    tags_to_rows[tag].sort();
    rows_to_tags[row].sort();
    await this._setTagsToRows(tags_to_rows);
    await this._setRowsToTags(rows_to_tags);
    await this._sanityCheckTags();
  }

  private async _unsetTag(row: Row, tag: Tag) {
    await this._sanityCheckTags();
    const tags_to_rows = await this._getTagsToRows();
    const rows_to_tags = await this._getRowsToTags();
    errors.assert(tags_to_rows[tag].includes(row));
    errors.assert(rows_to_tags[row].includes(tag));
    tags_to_rows[tag] = tags_to_rows[tag].filter((el) => { return el !== row; });
    rows_to_tags[row] = rows_to_tags[row].filter((el) => { return el !== tag; });
    if (tags_to_rows[tag].length === 0) {
      delete tags_to_rows[tag];
    }
    if (rows_to_tags[row].length === 0) {
      delete rows_to_tags[row];
    }
    await this._setTagsToRows(tags_to_rows);
    await this._setRowsToTags(rows_to_tags);
    await this._sanityCheckTags();
  }

  public async listEvents(): Promise<string> {
    const cal = ical();
    const rowsToTags = await this._getRowsToTags();
    await Promise.all(Object.keys(rowsToTags).map(async (row) => {
      const tags = rowsToTags[Number(row)];
      if (tags.some(tag => tag !== null && tag.startsWith('end:'))) {
        let content = (await this.session.document.getLine(Number(row))).join('');
        if (content.startsWith('~~')) {
          content = content.slice(2, -2);
        }
        const startTime = tags.find(t => t.startsWith('start:'))?.split('start:').pop();
        const endTime = tags.find(t => t.startsWith('end:'))!.split('end:').pop();
        cal.createEvent({
          id: endTime,
          start: startTime ? Moment(startTime) : Moment(endTime).subtract('hour', 1),
          end: Moment(endTime),
          summary: content
        });
      }
      return Promise.resolve();
    }));
    return cal.toString();
  }

  public async listTags(): Promise<{[tag: string]: Path[]}> {
    await this._sanityCheckTags();
    const tags_to_rows = await this._getTagsToRows();

    const all_tags: {[tag: string]: Path[]} = {};
    await Promise.all(
      Object.keys(tags_to_rows).map(async (tag) => {
        const rows = tags_to_rows[tag];
        all_tags[tag] = [];
        await Promise.all(
          rows.map(async (row) => {
            const path = await this.document.canonicalPath(row);
            if (path !== null) {
              all_tags[tag].push(path);
            }
          })
        );
      })
    );
    return all_tags;
  }

  // Set the tag for row
  // Returns whether setting tag succeeded
  public async addTag(row: Row, tag: Tag) {
    const tags_to_rows = await this._getTagsToRows();
    // const rows_to_tags = await this._getRowsToTags();

    if (tag in tags_to_rows) {
      if (tags_to_rows[tag].includes(row)) {
        return 'Already tagged, nothing to do!';
      }
    }

    await this.session.do(new this.SetTag(row, tag));
    this.document.emit('tagChange');
    return null;
  }

  public async clearTags() {
    await this._setTagsToRows({});
    await this._setRowsToTags({});
  }

  // Delete the tag for row
  // Returns whether removing tag succeeded
  public async removeTag(row: Row, tag: Tag) {
    const rows_to_tags = await this._getRowsToTags();
    const oldtags = rows_to_tags[row];

    if (oldtags === null || !oldtags.includes(tag)) {
        return 'Tag not in row, nothing to do!';
    }

    await this.session.do(new this.UnsetTag(row, tag));

    return null;
  }
  // Set the tag for row

  // Returns whether setting tag succeeded
  public async setTags(row: Row, tags: Tags) {
    const rows_to_tags = await this._getRowsToTags();

    let err = null;

    if (row in rows_to_tags) {
      for (let tag of rows_to_tags[row]) {
        err = await this.removeTag(row, tag);
      }
    }
    if (err) {
      return err;
    }
    for (let tag of tags) {
      err = await this.addTag(row, tag);
    }
    this.document.emit('tagChange');
    if (err) {
      return err;
    }
    return null;
  }
}


export const pluginName = 'Tags';

registerPlugin<TagsPlugin>(
  {
    name: pluginName,
    author: 'Victor Tao',
    description:
      `Similar to Marks, but each row can have multiple tags and tags can be reused.
      Press '#' to add a new tag, 'd#[number]' to remove a tag, and '-' to search tags.
   `,
    version: 1,
  },
  async (api) => {
    const tagsPlugin = new TagsPlugin(api);
    await tagsPlugin.enable();
    return tagsPlugin;
  },
  (api) => api.deregisterAll(),
);

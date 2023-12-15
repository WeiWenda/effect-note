import {CachedRowInfo, InMemorySession, Path, Row, Session} from '../../share';
import { Dropdown, MenuProps, message} from 'antd';
import * as React from 'react';
import {useState} from 'react';
import {TagsPlugin} from '../tags';
import {LinksPlugin} from './index';
import {MarksPlugin} from '../marks';
import $ from 'jquery';
import {downloadFile} from '../../ts/util';
import Moment from 'moment/moment';
import {shareDoc} from '../../share/ts/utils/APIUtils';
import {copyToClipboard} from '../../components';

export function exportAction(session: Session, path: Path, mimeType: string, filename?: string) {
  session.getCurrentContent(path, mimeType).then(content => {
    session.exportModalContent = content;
    session.emit('openModal', 'export');
    session.document.getText(path.row).then(blockContent => {
      session.exportFileFunc = () => {
        downloadFile(`${blockContent ? blockContent : (filename ? filename : 'effect-note-export')}`, content, mimeType);
      };
      session.emit('updateAnyway');
    });
  });
}

export function shareAction(session: Session, path: Path, mimeType: string) {
  session.getCurrentContent(path, mimeType).then(content =>
    shareDoc(content).then(shortLink => {
      session.exportModalContent = 'http://demo.effectnote.com/note/-2?s=' + shortLink;
      session.exportFileFunc = () => {};
      session.emit('openModal', 'export');
    })
  );
}

export const getTaskStatus = (tags: string[]) => {
  let status: string | undefined = undefined;
  if (tags.some((t: string) => new RegExp('(create|start|end|due):.*').test(t))) {
    const startTag = tags.find(t => t.startsWith('start:'));
    const endTag = tags.find(t => t.startsWith('end:'));
    const dueTag = tags.find(t => t.startsWith('due:'));
    if (endTag) {
      const endTime = Moment(endTag.split('end:')[1]);
      if (dueTag && endTime.isAfter(Moment(dueTag.split('due:')[1]))) {
        status = 'Done';
      } else {
        status = 'Done';
      }
    } else if (startTag) {
      const startTime = Moment(startTag.split('start:')[1]);
      if (dueTag && startTime.isAfter(Moment(dueTag.split('due:')[1]))) {
        status = 'Delay';
      } else {
        status = 'Doing';
      }
    } else if (dueTag) {
      const dueTime = Moment(dueTag.split('due:')[1]);
      if (Moment().isAfter(dueTime)) {
        status = 'Delay';
      } else {
        status = 'Todo';
      }
    } else {
      status = 'Todo';
    }
  }
  return status;
};

export function HoverIconDropDownComponent(props: {session: Session, bullet: any,
  path: Path, rowInfo: CachedRowInfo
  tagsPlugin: TagsPlugin,
  markPlugin: MarksPlugin,
  linksPlugin: LinksPlugin
}) {
  const [dropDownOpen, setDropDownOpen ] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const items: MenuProps['items'] = [
    {
      label: '展开',
      key: 'unfold',
      children: [
        {
          label: '展开全部子节点',
          key: 'unfold_100',
        },
        {
          label: '展开至一级子节点',
          key: 'unfold_1',
        },
        {
          label: '展开至二级子节点',
          key: 'unfold_2',
        },
        {
          label: '展开至三级子节点',
          key: 'unfold_3',
        },
        {
          label: '折叠全部子节点',
          key: 'fold_100',
        }
      ],
    },
    {
      label: '插入',
      key: 'insert',
      children: [
        {
          label: '插入markdown（vditor）',
          key: 'insert_md',
        },
        {
          label: '插入富文本（wangEditor）',
          key: 'insert_rtf',
        },
        {
          label: '插入思维导图（百度脑图）',
          key: 'add_png',
        },
        {
          label: '插入流程图（Drawio）',
          key: 'insert_drawio',
        },
        // {
        //   label: '插入文本识别',
        //   key: 'ocr',
        // }
      ]
    },
    {
      label: '标记',
      key: 'mark',
      children: [
        {
          label: '收藏',
          key: 'mark_mark',
        },
        {
          label: '标签',
          key: 'mark_tag',
        },
        {
          label: '任务',
          key: 'mark_check',
        },
        {
          label: '看板',
          key: 'mark_board',
        },
        {
          label: '序号',
          key: 'mark_order',
        },
        {
          label: '引用',
          key: 'mark_callout',
        }
      ]
    },
    {
      label: '清空',
      key: 'delete'
    },
    {
      label: '导入',
      key: 'load',
      children: [
        {
          label: '导入pdf',
          key: 'load_pdf',
        },
        {
          label: '导入markdown',
          key: 'load_md',
        },
        {
          label: '导入opml',
          key: 'load_opml',
        }
      ]
    },
    {
      label: '导出',
      key: 'export',
      children: [
        {
          label: '导出为markdown',
          key: 'export_md',
        },
        {
          label: '导出为json',
          key: 'export_json',
        },
        {
          label: '导出为text（兼容WorkFlowy）',
          key: 'export_text',
        },
        {
          label: '生成超链接（用于节点引用）',
          key: 'export_url',
        }
      ],
    }
  ];
  const replaceEmptyBlock = async () => {
    const parent = props.path.parent!;
    const index = await props.session.document.indexInParent(props.path);
    // 避免check状态清空不了
    props.session.cursor.reset();
    const newRow = await props.session.addBlocks(parent, index + 1, [''], {});
    const childrens = await props.session.document._getChildren(props.path.row);
    if (childrens.length > 0) {
      await props.session.attachBlocks(newRow[0], childrens);
    }
    await props.session.cursor.setPosition(newRow[0], 0);
    await props.session.delBlocks(parent.row, index, 1);
    props.session.emit('updateInner');
  };
  const onClick: MenuProps['onClick'] = ({ key }) => {
    setDropDownOpen(false);
    props.session.selectPopoverOpen = false;
    props.session.setMode('INSERT');
    if (key.startsWith('fold')) {
      const foldLevel = Number(key.split('_').pop());
      props.session.foldBlock(props.path, foldLevel, true).then(() => {
        props.session.emit('updateInner');
      });
      return;
    }
    if (key.startsWith('unfold')) {
      const unfoldLevel = Number(key.split('_').pop());
      props.session.foldBlock(props.path, unfoldLevel, false).then(() => {
        props.session.emit('updateInner');
      });
      return;
    }
    switch (key) {
      case 'load_pdf':
        props.session.fileInputRef.current.setPath(props.path);
        $('#file-uploader').trigger('click');
        break;
      case 'load_md':
        props.session.fileInputRef.current.setPath(props.path);
        $('#file-uploader').trigger('click');
        break;
      case 'mark_mark':
        props.markPlugin.setMark(props.path.row, props.rowInfo.line.join('')).then(() => {
          props.session.emit('updateInner');
        });
        break;
      case 'mark_check':
        props.session.emitAsync('toggleCheck', props.path.row).then(() => {
          props.session.emit('updateInner');
        });
        break;
      case 'mark_board':
        props.session.emitAsync('toggleBoard', props.path.row).then(() => {
          props.session.emit('updateInner');
        });
        break;
      case 'mark_order':
        props.session.emitAsync('toggleOrder', props.path.row).then(() => {
          props.session.emit('updateInner');
        });
        break;
      case 'mark_callout':
        props.session.emitAsync('toggleCallout', props.path.row).then(() => {
          props.session.emit('updateInner');
        });
        break;
      case 'mark_tag':
        props.tagsPlugin.tagstate = {
          session: new InMemorySession(),
          path: props.path
        };
        props.linksPlugin.api.updatedDataForRender(props.path.row).then(() => {
          props.session.emit('updateInner');
        });
        break;
      case 'mark_task':
        props.tagsPlugin.getTags(props.path.row).then(tags => {
          if (tags === null ||  tags.every((t: string) => !['Delay', 'Done', 'Todo', 'Doing'].includes(t))) {
            props.tagsPlugin.setTags(props.path.row, ['Todo', ...(tags || [])]).then(() => {
              props.session.emit('updateAnyway');
            });
          }
        });
        break;
      case 'ocr':
        props.session.emit('openModal', 'ocr');
        break;
      case 'insert_md':
        props.session.emit('openModal', 'md', {'md': '暂无内容'});
        props.session.mdEditorOnSave = (markdown: string, _html: string) => {
          props.linksPlugin.setMarkdown(props.path.row, markdown).then(() => {
            props.session.emit('updateAnyway');
            // let wrappedHtml = html;
            // wrappedHtml = `<div class='node-html'>${html}</div>`;
            // props.session.changeChars(props.path.row, 0, props.rowInfo.line.length, (_ ) => wrappedHtml.split('')).then(() => {
            // });
          });
        };
        break;
      case 'insert_drawio':
        props.session.emit('setDrawio', props.path.row);
        break;
      case 'insert_rtf':
        props.session.emit('openModal', 'rtf', {html: '<span>暂无内容</span>'});
        props.session.wangEditorOnSave = (content: any) => {
          const wrappedHtml = `<div class='node-html'>${content}</div>`;
          props.session.emitAsync('setRTF', props.path.row, wrappedHtml).then(() => {
            props.session.emit('updateInner');
          });
        };
        break;
      case 'add_png':
        props.session.emit('openModal', 'png');
        props.session.pngOnSave = (img_src: any, json: any) => {
          props.linksPlugin.setPng(props.path.row, img_src, json).then(() => {
            props.session.emit('updateAnyway');
          });
        };
        setTimeout(() => {
          props.session.getKityMinderNode(props.path).then(kmnode => {
            props.session.mindMapRef.current.setContent(kmnode);
          });
        }, 1000);
        break;
      case 'export_md':
        exportAction(props.session, props.path, 'text/markdown');
        break;
      case 'export_json':
        exportAction(props.session, props.path, 'application/json');
        break;
      case 'export_text':
        exportAction(props.session, props.path, 'text/plain');
        break;
      case 'export_url':
        const url = `http://localhost:51223/note/${props.session.clientStore.getClientSetting('curDocId')}?f=${props.path.row}`;
        copyToClipboard(url);
        props.session.showMessage('已复制到粘贴板');
        break;
      case 'delete':
        replaceEmptyBlock();
        break;
      default:
        message.info(`Click on item ${key}`);
    }
  };
  // if (pluginData.links?.link === null) {
  //     dynamicOperations.push({
  //         label: '新增扩展阅读',
  //         key: 'add_link',
  //     });
  // }
  const menusProps = {
    items,
    onClick,
    openKeys: openKeys,
    onOpenChange: (newOpenKeys: string[]) => {
      // if (openKeys.length === 2 && newOpenKeys.length === 0) {
      //   return;
      // }
      setOpenKeys(newOpenKeys);
    }
  };
  return (
    <Dropdown
      open={dropDownOpen}
      onOpenChange={(open) => {
        setDropDownOpen(open);
        if (open) {
          props.session.selectPopoverOpen = true;
        } else {
          props.session.selectPopoverOpen = false;
        }
      }}
      menu={menusProps} trigger={['click']} >
      {props.bullet}
    </Dropdown>
  );
}

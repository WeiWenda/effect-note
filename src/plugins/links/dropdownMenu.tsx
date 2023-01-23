import {CachedRowInfo, InMemorySession, Path, Row, Session} from '../../share';
import {DatePicker, Dropdown, MenuProps, message} from 'antd';
import * as React from 'react';
import {useState} from 'react';
import {TagsPlugin} from '../tags';
import {LinksPlugin} from './index';
import dayjs from 'dayjs';
import {MarksPlugin} from '../marks';
import $ from 'jquery';
import {downloadFile} from '../../ts/util';

export function exportAction(session: Session, path: Path, mimeType: string, filename?: string) {
  session.getCurrentContent(path, mimeType).then(content => {
    session.exportModalContent = content;
    session.exportModalVisible = true;
    session.document.getText(path.row).then(blockContent => {
      session.exportFileFunc = () => {
        downloadFile(`${blockContent ? blockContent : (filename ? filename : 'effect-note-export')}`, content, mimeType);
      };
      session.emit('updateAnyway');
    });
  });
}

export function HoverIconDropDownComponent(props: {session: Session, bullet: any,
  path: Path, rowInfo: CachedRowInfo
  tagsPlugin: TagsPlugin,
  markPlugin: MarksPlugin,
  linksPlugin: LinksPlugin,
  onInsertDrawio: (row: Row) => void,
}) {
  const [dropDownOpen, setDropDownOpen ] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const setTags = (prefix: string, dateString: string) => {
    props.tagsPlugin.getTags(props.path.row).then(tags => {
      const filteredTags = tags?.filter(t => !t.startsWith(prefix)) || [];
      props.tagsPlugin.setTags(props.path.row, [prefix + dateString, ...filteredTags]).then(() => {
        props.session.emit('updateAnyway');
      });
    });
  };
  const getDateString = (prefix: string) => {
    const dateString = props.rowInfo.pluginData.tags?.tags?.find((t: string) => t.startsWith(prefix))?.split(prefix)[1];
    return dateString ? dayjs(dateString, 'YYYY-MM-DD HH:mm:ss') : undefined;
  };
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
        {
          label: '插入文本识别',
          key: 'ocr',
        }
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
          key: 'mark_task',
          children: [
            {
              label: (
                <DatePicker showTime={true} defaultValue={getDateString('due: ')}
                            placeholder='截止时间' onChange={(_, dateString) => {
                  setOpenKeys([]);
                  setDropDownOpen(false);
                  props.session.hoverOpen = false;
                  setTags('due: ', dateString);
                }}></DatePicker>
              ),
              key: 'mark_task_deadline'
            },
            {
              label: (
                <DatePicker showTime={true} defaultValue={getDateString('end: ')}
                            placeholder='完成时间' onChange={(_, dateString) => {
                  setOpenKeys([]);
                  setDropDownOpen(false);
                  props.session.hoverOpen = false;
                  setTags('end: ', dateString);
                }}></DatePicker>
              ),
              key: 'mark_task_end'
            },
            {
              label: (
                <DatePicker showTime={true} defaultValue={getDateString('start: ')}
                            placeholder='开始时间' onChange={(_, dateString) => {
                  setOpenKeys([]);
                  setDropDownOpen(false);
                  props.session.hoverOpen = false;
                  setTags('start: ', dateString);
                }}></DatePicker>
              ),
              key: 'mark_task_start'
            },
          ]
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
        }
      ],
    }
  ];
  const replaceEmptyBlock = async () => {
    const parent = props.path.parent!;
    const index = await props.session.document.indexInParent(props.path);
    const newRow = await props.session.addBlocks(parent, index + 1, [''], {});
    const childrens = await props.session.document._getChildren(props.path.row);
    if (childrens.length > 0) {
      await props.session.attachBlocks(newRow[0], childrens);
    }
    await props.session.delBlocks(parent.row, index, 1);
    props.session.cursor.setPosition(newRow[0], 0);
    props.session.emit('updateInner');
  };
  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('mark_task')) {
      return;
    }
    setDropDownOpen(false);
    props.session.hoverOpen = false;
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
      case 'load_md':
        props.session.fileInputRef.current.setPath(props.path);
        $('#file-uploader').trigger('click');
        break;
      case 'mark_mark':
        props.markPlugin.setMark(props.path.row, props.rowInfo.line.join('')).then(() => {
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
      case 'ocr':
        props.session.ocrModalVisible = true;
        props.session.emit('updateAnyway');
        break;
      case 'insert_md':
        props.session.md = props.rowInfo.pluginData.links.md || props.rowInfo.line.join('');
        props.session.mdEditorModalVisible = true;
        props.session.mdEditorOnSave = (markdown: string, _html: string) => {
          props.linksPlugin.setMarkdown(props.path.row, markdown).then(() => {
            props.session.emit('updateAnyway');
            // let wrappedHtml = html;
            // wrappedHtml = `<div class='node-html'>${html}</div>`;
            // props.session.changeChars(props.path.row, 0, props.rowInfo.line.length, (_ ) => wrappedHtml.split('')).then(() => {
            // });
          });
        };
        props.session.emit('updateAnyway');
        break;
      case 'insert_drawio':
        props.onInsertDrawio(props.path.row);
        break;
      case 'insert_rtf':
        setTimeout(() => {
          if (props.rowInfo.line.join('').startsWith('<div class=\'node-html\'>')) {
            props.session.wangEditorHtml = props.rowInfo.line.join('').slice('<div class=\'node-html\'>'.length, -6);
          } else {
            props.session.wangEditorHtml = props.rowInfo.line.join('');
          }
          props.session.emit('updateAnyway');
        }, 100);
        props.session.wangEditorModalVisible = true;
        props.session.wangEditorOnSave = (html: any) => {
          let wrappedHtml = html;
          wrappedHtml = `<div class='node-html'>${html}</div>`;
          props.session.changeChars(props.path.row, 0, props.rowInfo.line.length, (_ ) => wrappedHtml.split('')).then(() => {
            props.session.emit('updateAnyway');
          });
        };
        props.session.emit('updateAnyway');
        break;
      case 'add_png':
        props.session.pngModalVisible = true;
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
        props.session.emit('updateAnyway');
        break;
      case 'add_link':
        props.session.formSubmitAction = (value) => {
          props.linksPlugin.setLink(props.path.row, value).then(() => {
            props.session.emit('updateAnyway');
          });
        };
        props.session.emit('updateAnyway');
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
      if (openKeys.length === 2 && newOpenKeys.length === 0) {
        return;
      }
      setOpenKeys(newOpenKeys);
    }
  };
  return (
    <Dropdown
      open={dropDownOpen}
      onOpenChange={(open) => {
        setDropDownOpen(open);
        props.session.cursor.reset();
        props.session.hoverOpen = open;
      }}
      menu={menusProps} trigger={['click']} >
      {props.bullet}
    </Dropdown>
  );
}

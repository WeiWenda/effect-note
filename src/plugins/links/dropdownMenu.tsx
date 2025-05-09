import {CachedRowInfo, InMemorySession, Path, Row, RowInfo, Session} from '../../share';
import { Dropdown, MenuProps, message} from 'antd';
import * as React from 'react';
import {useState} from 'react';
import {TagsPlugin} from '../tags';
import {LinksPlugin} from './index';
import {MarksPlugin} from '../marks';
import $ from 'jquery';
import {downloadFile} from '../../ts/util';
import Moment from 'moment/moment';
import {shareDoc, uploadJson} from '../../share/ts/utils/APIUtils';
import {copyToClipboard} from '../../components';
import {useLocation, useSearchParams} from 'react-router-dom';

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

export function exportDataLoom(session: Session, content: string, row: Row, mimeType: string) {
  session.exportModalContent = content;
  session.emit('openModal', 'export');
  session.document.getText(row).then(blockContent => {
    session.exportFileFunc = () => {
      downloadFile(`${blockContent ? blockContent : 'dataloom-export'}`, content, mimeType);
    };
    session.emit('updateAnyway');
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
  path: Path, rowInfo: RowInfo
  tagsPlugin: TagsPlugin,
  markPlugin: MarksPlugin,
  linksPlugin: LinksPlugin
}) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
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
          label: '插入代码块（MonacoEditor）',
          key: 'insert_code',
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
          label: '插入表格（DataLoom）',
          key: 'insert_dataloom',
        },
        {
          label: '生成软链',
          key: 'insert_softlink',
        }
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
          label: '任务',
          key: 'mark_check',
        },
        {
          label: '自动编号',
          key: 'mark_order',
        },
        {
          label: '标签',
          key: 'mark_tag',
        },
        {
          label: '引用',
          key: 'mark_callout',
        },
        {
          label: '看板',
          key: 'mark_board',
        },
        {
          label: '收藏',
          key: 'mark_mark',
        },
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
          label: '生成引用链接',
          key: 'export_url',
        }
      ].concat(props.session.serverConfig.imgur?.type === 'picgo' && process.env.REACT_APP_BUILD_PLATFORM !== 'mas' ? [
        {
          label: '生成分享链接',
          key: 'export_picgo',
        }
      ] : []),
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
    await props.session.delBlocks(parent.row, index, 1, {noSave: true});
    props.session.emit('updateInner');
  };
  const onClick: MenuProps['onClick'] = ({ key }) => {
    setDropDownOpen(false);
    props.session.setSelectPopoverOpen('');
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
      case 'load_md':
      case 'load_opml':
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
      case 'insert_code':
        props.session.emitAsync('setCode', props.path.row, '', 'plaintext', false).then(() => {
          props.session.emit('updateInner');
          setTimeout(() => {
            if (props.session.codeRef[props.path.row]) {
              props.session.codeRef[props.path.row].current?.focus();
            }
          });
        });
        break;
      case 'insert_drawio':
        props.session.emit('setDrawio', props.path.row);
        break;
      case 'insert_softlink':
        // 根节点没有dropdownMenu，因此parent不为null
        const parent = props.path.parent!;
        props.session.document.indexInParent(props.path).then(indexInParent => {
          let softLinkTarget = props.path.row;
          if (props.rowInfo.pluginData.links?.soft_link) {
            softLinkTarget = props.rowInfo.pluginData.links?.soft_link;
          }
          props.session.addBlocks(parent, indexInParent + 1, [{
            text: props.rowInfo.line.join(''),
            collapsed: false,
            plugins: {soft_link: softLinkTarget},
            children: props.rowInfo.childRows.map(r => {return {clone: r}; })
          }]).then(() => {
            props.session.emit('updateInner');
          });
        });
        break;
      case 'insert_dataloom':
        props.session.emit('setDataLoom', props.path.row, '', '');
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
        props.session.emit('insert-mindmap', props.path.row);
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
      case 'export_picgo':
        props.session.getCurrentContent(props.path, 'application/json', true).then(jsonContent => {
          if (props.session.serverConfig.imgur && props.session.serverConfig.imgur.type === 'picgo') {
            uploadJson(
              jsonContent,
              props.session.clientStore.getClientSetting('curDocId'),
              props.session.serverConfig.imgur).then(shareUrl => {
              const url = `http://demo.effectnote.com/note/-1?s=${shareUrl}`;
              copyToClipboard(url);
              props.session.showMessage('已复制到粘贴板');
            }).catch(e => {
              console.error(e);
              props.session.showMessage(`分享失败，报错信息: ${e.message}`);
            });
          } else {
            props.session.showMessage('PicGo未配置');
          }
        });
        break;
      case 'export_url':
        const url = `${window.location.origin}`
          + `${location.pathname}?f=${props.path.row}${searchParams.get('s') ? ('&' + searchParams.get('s')) : ''}`;
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
          props.session.setSelectPopoverOpen('dropdown-menu');
        } else {
          props.session.setSelectPopoverOpen('');
        }
      }}
      menu={menusProps} trigger={['click']} >
      {props.bullet}
    </Dropdown>
  );
}

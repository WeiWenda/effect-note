import {Select} from 'antd';
import * as React from 'react';
import {ClientStore, Line, Path, Session} from '../../ts';

const LableAndShortCut = (_client: ClientStore, label: string, shortcut: string) => {
  return (
    <div style={{display: 'flex', justifyContent: 'space-between'}}>
      {label}
      <span>{shortcut}</span>
    </div>
  );
};

export function NodeOperationComponent(props: {session: Session, line: Line, path: Path}) {
  const client = props.session.clientStore;
  const options = [
    {label: LableAndShortCut(client, '任务', '/task'), value: 'mark-task', shortcut: 'task'},
    {label: LableAndShortCut(client, '代码', '/code'), value: 'insert-code', shortcut: 'code'},
    {label: LableAndShortCut(client, '引用', '/quote'), value: 'mark-quote', shortcut: 'quote'},
    {label: LableAndShortCut(client, 'markdown', '/md'), value: 'insert-md', shortcut: 'md'},
    {label: LableAndShortCut(client, '富文本', '/rtf'), value: 'insert-rtf', shortcut: 'rtf'},
    {label: LableAndShortCut(client, '脑图', '/mindmap'), value: 'insert-mindmap', shortcut: 'mindmap'},
    {label: LableAndShortCut(client, '流程图', '/draw'), value: 'insert-drawio', shortcut: 'draw'},
    // {label: LableAndShortCut(client, '收藏', '/mark'), value: 'mark-mark', shortcut: 'mark'},
    // {label: LableAndShortCut(client, '标签', '/tag'), value: 'mark-tag', shortcut: 'tag'},
    // {label: LableAndShortCut(client, '看板', '/board'), value: 'mark-board', shortcut: 'board'},
    // {label: LableAndShortCut(client, '展开 -> 一级子节点', '/o1'), value: 'unfold-node-1', shortcut: 'o1'},
    // {label: LableAndShortCut(client, '展开 -> 二级子节点', '/o2'), value: 'unfold-node-2', shortcut: 'o2'},
    // {label: LableAndShortCut(client, '展开 -> 三级子节点', '/o3'), value: 'unfold-node-3', shortcut: 'o3'},
    // {label: LableAndShortCut(client, '展开 -> 全部子节点', '/oa'), value: 'unfold-node-100', shortcut: 'oa'},
  ];
  const onSelect = async (value: string) => {
    // 消除前导/
    await props.session.deleteAtCursor();
    switch (value) {
      case 'unfold-node-1':
      case 'unfold-node-2':
      case 'unfold-node-3':
      case 'unfold-node-100':
        const level = value.split('-').pop();
        await props.session.foldBlock(props.path, Number(level), false);
        break;
      case 'mark-mark':
        props.session.emit('setMark', props.path.row, props.line.join(''));
        break;
      case 'mark-board':
        props.session.emit('toggleBoard', props.path.row);
        break;
      case 'mark-tag':
        props.session.emit('startTag', props.path);
        await props.session.document.updateCachedPluginData(props.path.row);
        break;
      case 'mark-task':
        await props.session.emitAsync('toggleCheck', props.path.row);
        break;
      case 'mark-quote':
        await props.session.emitAsync('toggleCallout', props.path.row);
        break;
      case 'insert-md':
        props.session.emit('openModal', 'md', {'md': '暂无内容'});
        props.session.mdEditorOnSave = (markdown: string, _html: string) => {
          props.session.emitAsync('setMarkdown', props.path.row, markdown).then(() => {
            props.session.emit('updateAnyway');
          });
        };
        break;
      case 'insert-code':
        props.session.emitAsync('setCode', props.path.row, '', 'plaintext').then(() => {
          props.session.emit('updateInner');
          setTimeout(() => {
            if (props.session.codeRef[props.path.row]) {
              props.session.codeRef[props.path.row].current?.focus();
            }
          });
        });
        break;
      case 'insert-rtf':
        props.session.emit('openModal', 'rtf', {html: '<span>暂无内容</span>'});
        props.session.wangEditorOnSave = (content: any) => {
          const wrappedHtml = `<div class='node-html'>${content}</div>`;
          props.session.emitAsync('setRTF', props.path.row, wrappedHtml).then(() => {
            props.session.emit('updateInner');
          });
        };
        break;
      case 'insert-drawio':
        props.session.emit('setDrawio', props.path.row);
        break;
      case 'insert-mindmap':
        props.session.emit('openModal', 'png');
        props.session.pngOnSave = (img_src: any, img_json: any) => {
          props.session.emitAsync('setMindmap', props.path.row, img_src, img_json).then(() => {
            props.session.emit('updateAnyway');
          });
        };
        setTimeout(() => {
          props.session.getKityMinderNode(props.path).then(kmnode => {
            props.session.mindMapRef.current.setContent(kmnode);
          });
        }, 1000);
        break;
      default:
        props.session.showMessage(`${value} clicked!`);
    }
  };
  return (
    <Select
      showSearch
      suffixIcon={null}
      bordered={false}
      autoFocus={true}
      defaultOpen={true}
      id='operation-select'
      onSelect={(value, _option) => {
        onSelect(value).then(() => {
          setTimeout(() => {
            props.session.setMode('INSERT');
          }, 100);
        });
      }}
      onSearch={(value) => {
        const matchItem = options.filter(o => o.shortcut.startsWith(value));
        if (matchItem.length === 1) {
          onSelect(matchItem[0].value);
        }
        if (matchItem.length === 0) {
          props.session.mode = 'INSERT';
          props.session.addCharsAtCursor(value.split('')).then(() => {
            props.session.emit('modeChange', 'NODE_OPERATION', 'INSERT');
          });
        }
      }}
      filterOption={(input, option) => (option?.shortcut ?? '').startsWith(input)}
      style={{ width: 200 }}
      options={options}
    />
  );
}

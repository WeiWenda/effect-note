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
    {label: LableAndShortCut(client, 'markdown', '/md'), value: 'insert-md', shortcut: 'md'},
    {label: LableAndShortCut(client, '富文本', '/r'), value: 'insert-rtf', shortcut: 'r'},
    {label: LableAndShortCut(client, '代码', '/c'), value: 'insert-code', shortcut: 'c'},
    {label: LableAndShortCut(client, '脑图', '/mi'), value: 'insert-mindmap', shortcut: 'mi'},
    {label: LableAndShortCut(client, '流程图', '/d'), value: 'insert-drawio', shortcut: 'd'},
    // {label: LableAndShortCut(client, '标记 -> 收藏', '/mm'), value: 'mark-mark', shortcut: 'mm'},
    // {label: LableAndShortCut(client, '标记 -> 标签', '/mt'), value: 'mark-tag', shortcut: 'mt'},
    // {label: LableAndShortCut(client, '展开 -> 一级子节点', '/o1'), value: 'unfold-node-1', shortcut: 'o1'},
    // {label: LableAndShortCut(client, '展开 -> 二级子节点', '/o2'), value: 'unfold-node-2', shortcut: 'o2'},
    // {label: LableAndShortCut(client, '展开 -> 三级子节点', '/o3'), value: 'unfold-node-3', shortcut: 'o3'},
    // {label: LableAndShortCut(client, '展开 -> 全部子节点', '/oa'), value: 'unfold-node-100', shortcut: 'oa'},
  ];
  const onSelect = async (value: string) => {
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
        props.session.setMode('INSERT');
        break;
      case 'mark-tag':
        props.session.emit('startTag', props.path);
        await props.session.document.updateCachedPluginData(props.path.row);
        props.session.setMode('INSERT');
        break;
      case 'insert-md':
        props.session.emit('openModal', 'md', {'md': props.line.slice(0, -1).join('')});
        props.session.mdEditorOnSave = (markdown: string, _html: string) => {
          props.session.emitAsync('setMarkdown', props.path.row, markdown).then(() => {
            props.session.emit('updateAnyway');
          });
        };
        props.session.setMode('INSERT');
        break;
      case 'insert-code':
        await props.session.setMode('INSERT');
        const actualContent = await props.session.document.getLine(props.path.row);
        await props.session.emitAsync('setCode', props.path.row, actualContent.join(''), 'plaintext');
        await props.session.delChars(props.path.row, 0, actualContent.length);
        props.session.emit('updateInner');
        break;
      case 'insert-rtf':
        let html: string = props.line.slice(0, -1).join('');
        if (props.line.join('').startsWith('<div class=\'node-html\'>')) {
          html = props.line.join('').slice('<div class=\'node-html\'>'.length, -6);
        }
        props.session.emit('openModal', 'rtf', {html});
        props.session.wangEditorOnSave = (content: any) => {
          let wrappedHtml = `<div class='node-html'>${content}</div>`;
          props.session.changeChars(props.path.row, 0, props.line.length,
            (_ ) => wrappedHtml.split('')).then(() => {
            props.session.emit('updateAnyway');
          });
        };
        props.session.setMode('INSERT');
        break;
      case 'insert-drawio':
        props.session.emit('setDrawio', props.path.row);
        props.session.setMode('INSERT');
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
        props.session.setMode('INSERT');
        break;
      default:
        props.session.showMessage(`${value} clicked!`);
    }
  };
  return (
    <Select
      showSearch
      showArrow={false}
      autoFocus={true}
      defaultOpen={true}
      id='operation-select'
      onSelect={(value, _option) => {
        onSelect(value);
      }}
      onSearch={(value) => {
        const matchItem = options.filter(o => o.shortcut.startsWith(value));
        if (matchItem.length === 1) {
          onSelect(matchItem.pop()!.value);
        }
        if (matchItem.length === 0) {
          props.session.addCharsAtCursor(('/' + value).split(''));
          props.session.setMode('INSERT');
        }
      }}
      filterOption={(input, option) => (option?.shortcut ?? '').startsWith(input)}
      style={{ width: 200 }}
      options={options}
    />
  );
}

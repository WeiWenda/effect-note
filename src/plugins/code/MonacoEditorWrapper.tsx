import MonacoEditor, {monaco} from 'react-monaco-editor';
import * as React from 'react';
import {useRef, useState} from 'react';
import {Path, Session} from '../../share';
import {Input} from 'antd';

export function MonacoEditorWrapper(props: {
  session: Session,
  path: Path,
  title: string,
  pluginData: any,
  theme: string,
  lockEdit: boolean,
  onChange: (newValue: string) => void}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [defaultTitle, setDefaultTitle] = useState(' ');
  const [title, setTitle] = useState(props.title);
  const [height, setHeight] = useState(20);
  const [value, setValue] = useState(props.pluginData.links.code.content || '');
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  props.session.codeRef[props.path.row] = editorRef;
  return (
    <div>
        <div onClick={() => {
          setEditingTitle(true);
        }} onMouseLeave={() => {
          if (title !== props.title) {
            props.session.changeChars(props.path.row, 0, props.title.length, (_o) => title.split('')).then(() => {
              props.session.emit('updateInner');
            });
          }
          setEditingTitle(false);
        }} style={{padding: '5px 10px'}}>
          { editingTitle ?
            <Input style={{width: '30em'}}
                   value={title}
                   onChange={(newValue) => {
                     setTitle(newValue.target.value);
                   }}
            /> : title ? title : <span style={{opacity: '0.5'}}>{defaultTitle}</span> }
        </div>
      <MonacoEditor
        width='100%'
        height={Math.min(height, 400)}
        language={props.pluginData.links.code.language}
        theme={props.theme}
        value={value}
        options={{lineHeight: 20, lineNumbersMinChars: 5, scrollBeyondLastLine: false,
          wordWrap: props.pluginData.links.code.wrap ? 'on' : 'off',
          readOnly: props.lockEdit}}
        editorDidMount={(editor, _monaco) => {
          setHeight(editor.getContentHeight());
          editorRef.current = editor;
          editor.onDidFocusEditorWidget(() => {
            setDefaultTitle('请输入标题');
          });
          editor.onDidBlurEditorWidget(() => {
            setDefaultTitle(' ');
          });
        }}
        onChange={(newValue: string) => {
          setValue(newValue);
          props.onChange(newValue);
          setHeight(editorRef.current!.getContentHeight());
        }}
      />
    </div>
  );
}

import MonacoEditor, {monaco} from 'react-monaco-editor';
import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {Path, Session} from '../../share';
import {Input} from 'antd';

export function MonacoEditorWrapper(props: {
  session: Session,
  path: Path,
  pluginData: any,
  theme: string,
  lockEdit: boolean,
  onChange: (newValue: string) => void}) {
  const [height, setHeight] = useState(20);
  const [value, setValue] = useState(props.pluginData.links.code.content || '');
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  props.session.codeRef[props.path.row] = editorRef;
  useEffect(() => {
    if (editorRef.current) {
      setHeight(editorRef.current.getContentHeight());
    }
  }, [props.pluginData.links.code.wrap]);
  return (
    <div
      onMouseEnter={() => {
        props.session.stopAnchor();
        props.session.stopKeyMonitor('code-block');
      }}
      onMouseLeave={() => {
        props.session.startKeyMonitor();
      }}
    >
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
          // editor.onDidFocusEditorWidget(() => {
          //   setDefaultTitle('请输入标题');
          // });
          // editor.onDidBlurEditorWidget(() => {
          //   setDefaultTitle(' ');
          // });
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

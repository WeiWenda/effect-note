import MonacoEditor, {monaco} from 'react-monaco-editor';
import * as React from 'react';
import {useRef, useState} from 'react';

export function MonacoEditorWrapper(props: {
  pluginData: any,
  theme: string,
  lockEdit: boolean,
  onChange: (newValue: string) => void}) {
  const [height, setHeight] = useState(20);
  const [value, setValue] = useState(props.pluginData.links.code.content || '');
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  return (
    <div style={{paddingTop: '2em'}}>
      <MonacoEditor
        width='100%'
        height={Math.min(height, 400)}
        language={props.pluginData.links.code.language}
        theme={props.theme}
        value={value}
        options={{lineHeight: 20, lineNumbersMinChars: 5, scrollBeyondLastLine: false,
          wordWrap: 'on',
          readOnly: props.lockEdit}}
        editorDidMount={(editor, _monaco) => {
          setHeight(editor.getContentHeight());
          editorRef.current = editor;
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

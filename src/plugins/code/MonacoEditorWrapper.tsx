import MonacoEditor, {monaco} from 'react-monaco-editor';
import * as React from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Path, Session} from '../../share';
import {Select, Space, Tooltip} from 'antd';
import {getStyles} from '../../share/ts/themes';
import {copyToClipboard} from '../../components';
import {SpecialBlock} from '../../share/components/Block/SpecialBlock';
import {RightCircleOutlined} from '@ant-design/icons';
import ContentEditable from 'react-contenteditable';

const languages = ['plaintext', 'javascript', 'shell', 'python', 'json', 'sql', 'xml', 'yaml', 'c', 'java', 'scala',
   'go', 'php', 'typescript'];

function string_cmd(sCmd: string) {
  let func = new Function(sCmd);
  return (func()); // <--- note the parenteces
}
function string_exp(sCmd: string) {
  return Function(
    `'use strict'; 
        return (${sCmd})`
  )();
}

export function MonacoEditorWrapper(props: {
  session: Session,
  title: string,
  path: Path,
  pluginData: any,
  theme: string,
  lockEdit: boolean}) {
  const textColor = props.session.clientStore.getClientSetting('theme-text-primary');
  const selectStyle = `${props.session.clientStore.getClientSetting('curTheme').includes('Dark') ? 'invert(1)' : 'opacity(50%)'}` +
    ` drop-shadow(0 0 0 ${textColor}) saturate(1000%)`;
  const [height, setHeight] = useState(20);
  const [language, setLanguage] = useState(props.pluginData.links.code.language);
  const [wrap, setWrap] = useState(props.pluginData.links.code.wrap);
  const [result, setResult] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [value, setValue] = useState(props.pluginData.links.code.content || '');
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  props.session.codeRef[props.path.row] = editorRef;
  useEffect(() => {
    props.session.emitAsync('setCode',
      props.path.row, value, language, wrap).then(() => {
      props.session.emit('updateInner');
    });
  }, [value, language, wrap]);
  useEffect(() => {
    if (showResult) {
      try {
        const newResult = value.includes('return') ? string_cmd(value) : string_exp(value);
        setResult(String(newResult));
      } catch (e: any) {
        setResult(e.stack);
      }
    }
  }, [showResult, value]);
  useEffect(() => {
    if (editorRef.current) {
      setHeight(editorRef.current.getContentHeight());
    }
  }, [wrap]);
  return (
    <SpecialBlock key={'code-block'}
                  specialClass={'effect-code-block'}
                  path={props.path}
                  title={props.title}
                  collapse={props.pluginData.links.collapse || false}
                  blockType={
                    <Select
                      suffixIcon={null}
                      style={{width: 100, textAlign: 'right', ...getStyles(props.session.clientStore, ['theme-text-primary'])}}
                      bordered={false}
                      onFocus={() => {
                        props.session.stopAnchor();
                        props.session.setSelectPopoverOpen('code-block');
                      }}
                      onBlur={() => {
                        props.session.setSelectPopoverOpen('');
                      }}
                      value={ language.charAt(0).toUpperCase() + language.slice(1) }
                      onChange={(newLanguage: string) => {
                        setLanguage(newLanguage);
                        props.session.setSelectPopoverOpen('');
                      }}
                      options={languages.map(l => {
                        return {value: l, label: l};
                      })}
                    />
                  }
                  tools={
                    <Space>
                      {
                        props.pluginData.links.code.language === 'javascript' &&
                        <Tooltip title={'运行'}>
                            <RightCircleOutlined onClick={() => {
                              setShowResult(true);
                            }}/>
                        </Tooltip>
                      }
                      <Tooltip title={wrap ? '当前展示方式：自动换行' : '当前展示方式：内容溢出'}>
                        <img style={{position: 'relative', top: '3px', filter: selectStyle}}
                             onClick={() => {
                               setWrap(!wrap);
                             }}
                             src={`${process.env.PUBLIC_URL}/images/${wrap ? 'wrap' : 'nowrap'}.png`}
                             height={props.session.clientStore.getClientSetting('fontSize') + 2}/>
                      </Tooltip>
                    </Space>
                  }
                  session={props.session}
                  onCopy={() => {
                    copyToClipboard(props.pluginData.links.code.content);
                  }}
    >
      <div
        onMouseEnter={() => {
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
            wordWrap: wrap ? 'on' : 'off',
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
            setHeight(editorRef.current!.getContentHeight());
          }}
        />
        {
          showResult &&
            <div>
              <p>运行结果：</p>
              <MonacoEditor
                  height={Math.min(result.split('\n').length * 20, 400)}
                  options={{readOnly: true, scrollBeyondLastLine: false, wordWrap: 'off'}}
                  value={result}/>
            </div>
        }
      </div>
    </SpecialBlock>
  );
}

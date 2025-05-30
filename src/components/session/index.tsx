import {DocVersion, Modes, Path, Session, SessionComponent, SpinnerComponent} from '../../share';
import {Button, Dropdown, Input, MenuProps, Popover, Tooltip, Radio, Space} from 'antd';
import {
  HistoryOutlined,
  LeftOutlined,
  LockOutlined,
  MenuUnfoldOutlined,
  MoreOutlined,
  RightOutlined,
  StarFilled,
  StarOutlined,
  UnlockOutlined,
  RotateLeftOutlined,
  RotateRightOutlined
} from '@ant-design/icons';
import BreadcrumbsComponent from '../breadcrumbs';
import LayoutToolsComponent from '../layoutTools';
import {getDocContent, getDocVersions} from '../../share/ts/utils/APIUtils';
import Moment from 'moment/moment';
import FileToolsComponent from '../fileTools';
import * as React from 'react';
import {ReactNode, useEffect, useRef, useState} from 'react';
import {MarksPlugin} from '../../plugins/marks';
import {TagsPlugin} from '../../plugins/tags';
import { useForceUpdate } from '../layout';
import $ from 'jquery';
import {MonacoDiffEditor} from 'react-monaco-editor';
import {shiftMap} from '../../share/ts/keyEmitter';

const {Search} = Input;

export function SessionWithToolbarComponent(props: {session: Session, loading: boolean, filterOuter: string,
  showLayoutIcon: boolean,
  showLockIcon: boolean,
  beforeLoadDoc?: () => Promise<void>,
  afterLoadDoc?: () => Promise<void>
  curDocId: number,
  markPlugin?: MarksPlugin,
  tagPlugin?: TagsPlugin}) {
  const [stackSize, setStackSize] = useState(props.session.jumpHistory.length);
  const [curJumpIndex, setCurJumpIndex] = useState(props.session.jumpIndex);
  const [isMarked, setMarked] = useState(false);
  const [unfoldLevel, setUnfoldLevel] = useState(100);
  const [isRoot, setIsRoot] = useState(props.session.viewRoot.isRoot());
  const [filterInner, setFilterInner] = useState('');
  const [versions, setVersions] = useState(new Array<DocVersion>());
  const [compareVersion, setCompareVersion] = useState('');
  const [compareContent, setCompareContent] = useState('');
  const [unsavedContent, setUnsavedContent] = useState<string | null>(null);
  const [comments, setComments] = useState(new Array<ReactNode>);
  useEffect(() => {
    props.session.on('start-diff', (version, remoteContent, localContent) => {
      setCompareVersion(version);
      setCompareContent(remoteContent);
      setUnsavedContent(localContent);
    });
  }, []);
  // const [showProgress, setShowProgress] = useState(false);
  // const [progress, setProgress] = useState(0);
  const onCrumbClick = async (path: Path) => {
    const session = props.session;
    await session.zoomInto(path);
    session.save();
    session.emit('updateInner');
  };
  const textColor = props.session.clientStore.getClientSetting('theme-text-primary');
  const selectStyle = `opacity(100%) drop-shadow(0 0 0 ${textColor}) brightness(10)`;
  const unselectStyle = `opacity(10%) drop-shadow(0 0 0 ${textColor})`;
  const forceUpdate = useForceUpdate();
  const onSearchContent = (searchContent: string) => {
    setFilterInner(searchContent);
    props.session.applySearch(searchContent);
  };
  const unfoldMenus: MenuProps['items'] = [
    {
      key: 'h1',
      label: 'H1',
    }, {
      key: 'h2',
      label: 'H2',
    }, {
      key: 'h3',
      label: 'H3',
    }, {
      key: 'h100',
      label: 'ALL',
    }];
  useEffect(() => {
    if (!props.loading) {
      setFilterInner(props.filterOuter);
      props.session.applySearch(props.filterOuter);
    }
  }, [props.filterOuter, props.loading]);
  useEffect(() => {
    props.session.on('changeJumpHistory', (newStackSize: number, index: number) => {
      setStackSize(newStackSize);
      setCurJumpIndex(index);
    });
    props.session.on('changeViewRoot', async (path: Path) => {
      setIsRoot(path.isRoot());
      if (props.markPlugin) {
        const markInfo = await props.markPlugin.getMark(path.row);
        if (markInfo) {
          setMarked(true);
        } else {
          setMarked(false);
        }
      }
    });
    props.session.on('changeComment', async () => {
      const newComment = await props.session.applyHookAsync('renderComments', [], props.session);
      setComments(newComment);
      setTimeout(() => {
        const divs = $('.comment-wrapper');
        let curTop = 0;
        // 遍历每个元素并修改样式
        divs.each(function() {
          const position = $(this).position();
          const height = $(this).height()!;
          if (curTop < position.top) {
            // 未重叠的情况
            curTop = position.top + height;
          } else {
            curTop = curTop + 10;
            console.log('find overlap, move {} to {}', position, curTop);
            $(this).css({
              'top': curTop + 'px'
            });
            curTop = curTop + height;
          }
        });
      }, 100);
    });
  }, []);
  return (
    <div style={{width: '100%', height: '100%'}}>
      {
        props.loading &&
        <SpinnerComponent/>
      }
      {
        !props.loading &&
        <div className='file-toolbar' style={{
          borderColor: props.session.clientStore.getClientSetting('theme-bg-secondary')
        }}>
          <Space style={{paddingLeft: '10px'}}>
            <LeftOutlined
              onClick={() => {
                props.session.jumpPrevious();
              }}
              style={{
                filter: curJumpIndex === 0 ? unselectStyle : selectStyle
              }}/>
            <RightOutlined
              onClick={() => {
                props.session.jumpNext();
              }}
              style={{
                filter: (curJumpIndex + 1 >= stackSize ) ? unselectStyle : selectStyle
              }}/>
            <BreadcrumbsComponent key='crumbs'
                                  session={props.session}
                                  onCrumbClick={onCrumbClick}
            />
          </Space>
          <Space>
            {
              props.session.vimMode &&
              <span style={{fontSize: 12, float: 'right', paddingRight: '20px'}}>
                {'-- ' +  Modes.getMode(props.session.mode).name + ' --'}
              </span>
            }
            {
              compareVersion === '' &&
              <Space>
                <Search
                  size='small'
                  placeholder='搜索内容'
                  allowClear
                  value={filterInner}
                  onChange={(e) => onSearchContent(e.target.value)}
                  onPressEnter={(e: any) => {onSearchContent(e.target.value); }}
                  onFocus={() => {props.session.stopKeyMonitor('search-in-file'); } }
                  onBlur={() => {props.session.startKeyMonitor(); } }/>
                <Dropdown menu={{
                  items: unfoldMenus,
                  onClick: ({ key }) => {
                    const expandLevel = Number(key.substring(1));
                    setUnfoldLevel(expandLevel);
                    props.session.foldBlock(props.session.viewRoot, expandLevel, false).then(() => {
                      props.session.emit('updateInner');
                    });
                  },
                }}>
                    <Button>
                        <MenuUnfoldOutlined />
                        { unfoldLevel !== 100 && 'H' + unfoldLevel }
                    </Button>
                </Dropdown>
              </Space>
            }
            {
              props.showLayoutIcon &&
              <LayoutToolsComponent session={props.session} />
            }
            {
              compareVersion === '' && props.session.lockEdit && props.showLockIcon &&
                <Tooltip title='点击后解除锁定编辑'>
                    <LockOutlined onClick={() => {
                      props.session.lockEdit = false;
                      props.session.clientStore.setLockEdit(false);
                      props.session.showMessage('进入编辑模式');
                      forceUpdate();
                    }}/>
                </Tooltip>
            }
            {
              compareVersion === '' && !props.session.lockEdit && props.showLockIcon &&
                <Tooltip title='点击后锁定编辑'>
                    <UnlockOutlined onClick={() => {
                      props.session.lockEdit = true;
                      props.session.clientStore.setLockEdit(true);
                      props.session.showMessage('进入锁定模式');
                      forceUpdate();
                    }} />
                </Tooltip>
            }
            {
              compareVersion === '' && isMarked && !isRoot && props.markPlugin &&
                <StarFilled onClick={() => {
                  props.markPlugin!.setMark(props.session.viewRoot.row, '').then(() => {
                    setMarked(false);
                  });
                }} />
            }
            {
              compareVersion === '' && !isMarked && !isRoot && props.markPlugin &&
                <StarOutlined onClick={() => {
                  props.session.document.getText(props.session.viewRoot.row).then(text => {
                    props.markPlugin!.setMark(props.session.viewRoot.row, text).then(() => {
                      setMarked(true);
                    });
                  });
                }}/>
            }
            {
              props.curDocId !== -1 && props.beforeLoadDoc && props.afterLoadDoc &&
                <Popover placement='bottom' content={
                  <div style={{width: '200px', maxHeight: '100px', overflowY: 'auto'}}>
                    <Radio.Group
                      onChange={(v) => {
                      props.session.emit('openModal', 'loading');
                      setCompareVersion(v.target.value);
                      getDocContent(props.curDocId, v.target.value).then(async (res) => {
                        setCompareContent(res.content);
                        if (unsavedContent === null) {
                          const currentContent = await props.session.getCurrentContent(Path.root(), 'application/json', true);
                          setUnsavedContent(currentContent);
                        }
                        props.session.emit('closeModal', 'loading');
                      });
                    }} value={compareVersion}>
                      <Space direction='vertical'>
                        {
                          versions.map(version => {
                            return (
                              <Radio key={version.commitId} value={version.commitId}>
                                {Moment.unix(version.time).format('yyyy-MM-DD HH:mm:ss')}
                              </Radio>
                            );
                          })
                        }
                      </Space>
                    </Radio.Group>
                  </div>
                }
                         trigger='click'
                         onOpenChange={(open) => {
                           if (open) {
                             getDocVersions(props.curDocId).then(res => setVersions(res)).catch(e => {
                               props.session.showMessage(e, {warning: true});
                             });
                           }
                         }}>
                    <Tooltip title='查看历史版本'>
                      <HistoryOutlined />
                    </Tooltip>
                </Popover>
            }
            {
              !props.loading && compareVersion !== '' && unsavedContent && compareContent &&
                <Tooltip open={true} title='请在此处选择版本'>
                  <Space>
                    <Tooltip title='载入云端版本' placement={'bottom'}>
                      <RotateLeftOutlined
                        onClick={() => {
                          props.beforeLoadDoc!().then(() => {
                            props.session.reloadContent(compareContent).then(() => {
                              props.afterLoadDoc!().then(() => {
                                setCompareVersion('');
                                props.session.showMessage('版本回溯完成');
                              });
                            });
                          });
                      }} />
                    </Tooltip>
                    <Tooltip title='载入本地版本' placement={'bottom'}>
                      <RotateRightOutlined onClick={() => {
                        props.beforeLoadDoc!().then(() => {
                          props.session.reloadContent(unsavedContent).then(() => {
                            props.afterLoadDoc!().then(() => {
                              setCompareVersion('');
                              props.session.showMessage('载入当前版本完成');
                            });
                          });
                        });
                      }} />
                    </Tooltip>
                  </Space>
                </Tooltip>
            }
            <FileToolsComponent session={props.session} curDocId={props.curDocId}
                                tagPlugin={props.tagPlugin!}>
                <MoreOutlined style={{float: 'right', paddingRight: '10px'}} onClick={e => e.preventDefault()}/>
            </FileToolsComponent>
          </Space>
        </div>
      }
      {
        !props.loading && compareVersion === '' &&
          <div
              onKeyDown={(event) => {
                if (!props.session.keyEmitter?.onKeyDown(event.nativeEvent)) {
                  event.preventDefault();
                  event.stopPropagation();
                } else if (!event.repeat && Object.values(shiftMap).includes(props.session.keyEmitter?.getKeyName(event.nativeEvent))) {
                  event.stopPropagation();
                  const newEvent = new KeyboardEvent('keydown',
                    {key: event.nativeEvent.key, code: event.nativeEvent.code, shiftKey: true, repeat: true});
                  console.log('dispatch to document', newEvent, event);
                  document.dispatchEvent(newEvent);
                }
              }}
              className={`session-area ${comments.length ? 'session-area-with-comment' : ''}`}>
            <SessionComponent ref={props.session.sessionRef} session={props.session} />
            {
              comments.length > 0 &&
              <div className={'comment-area'}>
                {comments}
              </div>
            }
            </div>
      }
      {
        !props.loading && compareVersion !== '' && unsavedContent && compareContent &&
        <div
            className={`session-area session-diff-area`}
            onMouseEnter={() => {
              props.session.stopAnchor();
              props.session.stopKeyMonitor('diff');
            }}
            onMouseLeave={() => {
              props.session.startKeyMonitor();
            }}
        >
            <MonacoDiffEditor
                width='100%'
                height='100%'
                language='json'
                original={compareContent}
                value={unsavedContent}
                onChange={(newValue: string) => {
                  setUnsavedContent(newValue);
                }}
                options={{renderSideBySide: true, hideUnchangedRegions: {
                    enabled: true,
                    minimumLineCount: 50,
                }
                }}
            />
        </div>
      }
    </div>
  );
}

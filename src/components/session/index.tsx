import {DocVersion, Modes, Path, Session, SessionComponent, SpinnerComponent} from '../../share';
import {Button, Dropdown, Input, MenuProps, Popover, Progress, Radio, Space} from 'antd';
import {
  HistoryOutlined,
  LeftOutlined,
  LockOutlined,
  MenuUnfoldOutlined,
  MoreOutlined,
  RightOutlined,
  StarFilled,
  StarOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import BreadcrumbsComponent from '../breadcrumbs';
import LayoutToolsComponent from '../layoutTools';
import {getDocContent, getDocVersions} from '../../share/ts/utils/APIUtils';
import Moment from 'moment/moment';
import FileToolsComponent from '../fileTools';
import * as React from 'react';
import {ReactNode, useEffect, useState} from 'react';
import {MarksPlugin} from '../../plugins/marks';
import {default as FileSearch} from '../../share/ts/search';
import {TagsPlugin} from '../../plugins/tags';
import { useForceUpdate } from '../layout';

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
  const [currentVersion, setCurrentVersion] = useState('');
  const [comments, setComments] = useState(new Array<ReactNode>);
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
  const applyFilterInner = (filterContent: string) => {
    if (filterContent) {
      if (!props.session.search) {
        props.session.search = new FileSearch(async (query) => {
          const results = await props.session.document.search(props.session.viewRoot, query);
          console.log(results);
          return {
            rows: new Set(results.flatMap(({path}) => {
              return path.getAncestry();
            })),
            accentMap: new Map(results.map(result => [result.path.row, result.matches]))
          };
        }, props.session);
      }
      props.session.search?.update(filterContent);
    } else {
      props.session.search = null;
    }
  };
  const onSearchContent = (searchContent: string) => {
    setFilterInner(searchContent);
    applyFilterInner(searchContent);
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
      applyFilterInner(props.filterOuter);
    }
  }, [props.filterOuter, props.loading]);
  useEffect(() => {
    props.session.document.store.events.on('loadProgressChange', (show: boolean, newProgress: number) => {
      if (!show) {
        props.session.clientStore.setDocSetting('loaded', true);
      }
      // setShowProgress(show);
      // setProgress(newProgress);
    });
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
    });
    setTimeout(() => {
      props.session.emit('changeComment');
    }, 1000);
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
            <Search
              size='small'
              placeholder='搜索内容'
              allowClear
              value={filterInner}
              onChange={(e) => onSearchContent(e.target.value)}
              onPressEnter={(e: any) => {onSearchContent(e.target.value); }}
              onFocus={() => {props.session.stopKeyMonitor('search-in-file'); } }
              onBlur={() => {props.session.startKeyMonitor(); } }/>
            {
              props.showLayoutIcon &&
              <LayoutToolsComponent session={props.session} />
            }
            {/*{*/}
            {/*  showProgress &&*/}
            {/*    <Progress type='circle' percent={progress} size={20} />*/}
            {/*}*/}
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
            {
              props.session.lockEdit && props.showLockIcon &&
              <LockOutlined onClick={() => {
                props.session.lockEdit = false;
                props.session.showMessage('进入编辑模式');
                forceUpdate();
              }}/>
            }
            {
              !props.session.lockEdit && props.showLockIcon &&
              <UnlockOutlined onClick={() => {
                props.session.lockEdit = true;
                props.session.showMessage('进入锁定模式');
                forceUpdate();
              }} />
            }
            {
              isMarked && !isRoot && props.markPlugin &&
              <StarFilled onClick={() => {
                props.markPlugin!.setMark(props.session.viewRoot.row, '').then(() => {
                  setMarked(false);
                });
              }} />
            }
            {
              !isMarked && !isRoot && props.markPlugin &&
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
                    <Radio.Group onChange={(v) => {
                      setCurrentVersion(v.target.value);
                      getDocContent(props.curDocId, v.target.value).then((res) => {
                        props.session.showMessage('版本回溯中...');
                        props.beforeLoadDoc!().then(() => {
                          props.session.reloadContent(res.content).then(() => {
                            props.afterLoadDoc!().then(() => {
                              props.session.showMessage('版本回溯完成');
                            });
                          });
                        });
                      });
                    }} value={currentVersion}>
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
                  <HistoryOutlined />
                </Popover>
            }
            <FileToolsComponent session={props.session} curDocId={props.curDocId}
                                tagPlugin={props.tagPlugin!}>
                <MoreOutlined style={{float: 'right', paddingRight: '10px'}} onClick={e => e.preventDefault()}/>
            </FileToolsComponent>
          </Space>
        </div>
      }
      {
        !props.loading &&
          <div className={'session-area'}>
            <SessionComponent ref={props.session.sessionRef} session={props.session} />
            {
              comments.length > 0 &&
              <div className={'comment-area'}>
                {comments}
              </div>
            }
            </div>
      }
    </div>
  );
}

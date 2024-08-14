import {DocInfo, IndexedDBBackend, InMemory, Path, Session, SubscriptionInfo, SubscriptionSearchResult} from '../../share';
import Config from '../../share/ts/config';
import {Input, List, Tree} from 'antd';
import type {DataNode} from 'antd/es/tree';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {getStyles} from '../../share/ts/themes';
import {DraggableCore} from 'react-draggable';
import {AimOutlined, SearchOutlined} from '@ant-design/icons';
import {getSubscriptionFileContent, getSubscriptionFiles, getSubscriptions, searchSubscription} from '../../share/ts/utils/APIUtils';
import {SessionWithToolbarComponent} from '../session';
import {mimetypeLookup} from '../../ts/util';
import { useSearchParams } from 'react-router-dom';

const {Search} = Input;

export function YangComponent(props: {session: Session, config: Config}) {
  let [searchParams, setSearchParams] = useSearchParams();
  const [fileListWidth, setFileListWidth] = useState(250);
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [filter, setFilter] = useState('');
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');
  const [filterOuter, setFilterOuter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTreeNode, setSelectedTreeNode] = useState<string[]>([]);
  const [expandedTreeNode, setExpandedTreeNode] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<string | undefined>(undefined);
  const [searchResult, setSearchResult] = useState<SubscriptionSearchResult[]>([]);
  const loadDoc = async (res: DocInfo) => {
    props.session.document.store.setBackend(new InMemory(), res.id!.toString());
    props.session.document.root = Path.root();
    props.session.cursor.reset();
    props.session.document.cache.clear();
    props.session.stopAnchor();
    props.session.search = null;
    props.session.document.removeAllListeners('lineSaved');
    props.session.document.removeAllListeners('beforeMove');
    props.session.document.removeAllListeners('beforeAttach');
    props.session.document.removeAllListeners('beforeDetach');
    let content = res.content!;
    const curDir = searchParams.get('v')!.split('/');
    const subName = curDir[0];
    curDir.pop();
    content = content.replace(/- \[(.*?)\]\((?!http)\/(.*?)\)/g, `- [$1](/discovery?v=${subName}/$2)`);
    content = content.replace(/- \[(.*?)\]\((?!http)(.*?)\)/g, `- [$1](/discovery?v=${curDir.join('/')}/$2)`);
    content = content.replace(/!\[(.*?)\]\((?!http)\/?(.*?)\)/g,
      `![$1](http://localhost:51223/api/subscription/img/${curDir.join('/')}/$2)`);
    await props.session.reloadContent(content, mimetypeLookup(res.name!));
    props.session.reset_history();
    props.session.reset_jump_history();
  };
  const updateTreeData = (list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] =>
    list.map((node) => {
      if (node.key === key) {
        return {
          ...node,
          children,
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children, key, children),
        };
      }
      return node;
    });
  const onLoadData = async ({ key, children }: any) => {
    if (children) {
      return;
    }
    const sub_files = await getSubscriptionFiles(key);
    setTreeData((origin: DataNode[]) => {
      return updateTreeData(origin, key,  sub_files.data);
    });
  };
  const focusSelected = async (filename: string) => {
    const keys: string[] = [];
    const paths = filename.split('/');
    while (paths.length > 1) {
      paths.pop();
      keys.unshift(paths.join('/'));
    }
    await Promise.all(keys.map(key => {
      return onLoadData({key});
    })).then(() => {
      setExpandedTreeNode(keys);
      setSelectedTreeNode([filename]);
    });
  };
  useEffect(() => {
    const searchTerm = searchParams.get('q');
    const filepath = searchParams.get('v');
    if (searchTerm) {
      let searchResultPromise: Promise<SubscriptionSearchResult[]> = Promise.resolve(searchResult);
      if (searchTerm !== filter) {
        setFilter(searchTerm);
        searchResultPromise = searchSubscription(searchTerm).then(res => {
          props.session.showMessage(`共找到${res.length}条记录`);
          setSearchResult(res);
          return Promise.resolve(res);
        }).catch(e => {
          props.session.showMessage(e, {warning: true});
        });
      }
      if (filepath) {
        searchResultPromise.then((srs) => {
          if (srs.map(sr => sr.ref).includes(filepath)) {
            getSubscriptionFileContent(filepath).then(res => {
              setLoading(true);
              loadDoc(res).then(() => {
                setLoading(false);
                setSelectedResult(filepath);
                focusSelected(filepath);
              });
            });
          }
        });
      }
    } else if (filepath) {
      getSubscriptionFileContent(filepath).then(res => {
        setLoading(true);
        loadDoc(res).then(() => {
          setLoading(false);
          setSelectedResult(filepath);
          focusSelected(filepath);
        });
      });
    } else {
      setFilter('');
      setSearchResult([]);
      setSelectedResult(undefined);
    }
  }, [searchParams]);
  useEffect(() => {
    getSubscriptions().then((res) => {
      const subscriptions = (Object.values(res.data) as SubscriptionInfo[]).filter(sub => {
        return !sub.disabled;
      }).sort((a, b) => {
        return (a.order || 0) - (b.order || 0);
      }).map(sub => { return {title: sub.name, key: sub.name}; });
      setTreeData(subscriptions);
    }).catch(e => {
      props.session.showMessage(e, {warning: true});
    });
  }, []);

  const onSearch = (value: string) => {
    props.session.clientStore.setClientSetting('curSearch', value);
    setSearchParams({q: value});
  };
  const onSelect = (_selectedKeysValue: React.Key[], info: any) => {
    const filepath = info.node.key as string;
    props.session.clientStore.setClientSetting('curSearchResult', filepath);
    setSearchParams({q: filter, v: filepath});
  };
  return (
    <div style={{height: '100%', flexDirection: 'row', display: 'flex', width: '100%'}}>
      <div style={{height: '100%', width: `${fileListWidth}px`, flexShrink: 0, flexGrow: selectedResult ? 0 : 1}}>
        <div className={selectedResult ? '' : filter ? 'sub-after-search' : 'sub-before-search'}>
          <Search
            onFocus={() => {props.session.stopKeyMonitor('subscription-search'); } }
            onBlur={() => {props.session.startKeyMonitor(); } }
            value={searchValue}
            placeholder='搜索关键字，前缀：title: 只搜文件名，空格（或） +（必须出现） -（不出现）'
            allowClear
            enterButton='Search'
            size='middle'
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={onSearch}
          />
        </div>
        {
          searchResult.length === 0 &&
          <div className={selectedResult ? 'sub-board-column' : 'sub-board-row'}>
            {
              treeData.map((subscription, i) => {
                return (
                  <Tree key={i} className={'sub-board-filelist'}
                        style={{
                          ...getStyles(props.session.clientStore, ['theme-bg-primary', 'theme-text-primary'])
                        }}
                        loadData={onLoadData}
                        expandedKeys={expandedTreeNode}
                        selectedKeys={selectedTreeNode}
                        treeData={[subscription]}
                        onSelect={onSelect}
                        onExpand={(keys) => setExpandedTreeNode(keys.map(k => k))}
                  />
                );
              })
            }
          </div>
        }
        {
          searchResult.length > 0 &&
          <div className={'sub-search-result-wrapper'}>
            <List
              header={<h3>检索结果</h3>}
              itemLayout='vertical'
              size='default'
              style={{marginLeft: '1em', flexGrow: '1'}}
              pagination={{
                onChange: (page) => {
                  console.log(page);
                },
                pageSize: 5,
              }}
              dataSource={searchResult}
              renderItem={(item) => (
                <List.Item
                  key={item.ref}
                  actions={[
                    <AimOutlined onClick={() => focusSelected(item.ref)}/>,
                    <SearchOutlined onClick={() => {
                      onSelect([], {node: {key: item.ref}});
                      setFilterOuter(filter);
                    }}/>,
                  ]}
                >
                  <span onClick={() => {
                    onSelect([], {node: {key: item.ref}});
                  }}>{item.ref}</span>
                </List.Item>
              )}
            />
            {
              !selectedResult &&
              <Tree className={'sub_filelist_after_search'}
                    style={{
                      ...getStyles(props.session.clientStore, ['theme-bg-primary', 'theme-text-primary'])
                    }}
                    expandedKeys={expandedTreeNode}
                    selectedKeys={selectedTreeNode}
                    loadData={onLoadData} treeData={treeData}
                    onSelect={onSelect}
                    onExpand={(keys) => setExpandedTreeNode(keys.map(k => k))}
              />
            }
          </div>
        }
      </div>
      {
        selectedResult &&
        <DraggableCore key='filelist_drag' onDrag={(_, ui) => {
          setFileListWidth(Math.min(Math.max(fileListWidth + ui.deltaX, 72), 700));
        }}>
          <div className='horizontal-drag' style={{
            ...getStyles(props.session.clientStore, ['theme-bg-secondary'])
          }}></div>
        </DraggableCore>
      }
      {
        selectedResult &&
        <SessionWithToolbarComponent curDocId={-2} loading={loading} session={props.session} filterOuter={filterOuter}
                                     showLayoutIcon={false} showLockIcon={true}/>
      }
    </div>
  );
}

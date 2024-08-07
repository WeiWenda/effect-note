import {Button, Checkbox, Space, Table, Tooltip} from 'antd';
import {CloudDownloadOutlined, DeleteOutlined} from '@ant-design/icons';
import * as React from 'react';
import {useCallback, useEffect, useState} from 'react';
import {Session, SubscriptionInfo} from '../../share';
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import type {ColumnsType} from 'antd/es/table';
import {addSubscription, getSubscriptions, updateSubscriptions} from '../../share/ts/utils/APIUtils';
import {DraggableBodyRow} from './dragRow';

function SubscriptionSettingsComponent(props: { session: Session}) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionInfo[]>([]);
  useEffect(() => {
    getSubscriptions().then((res) => {
      setSubscriptions((Object.values(res.data) as SubscriptionInfo[]).sort((a, b) => {
        return (a.order || 0) - (b.order || 0);
      }));
    });
  }, []);
  const saveSubscription = () => {
    const body: any = {};
    subscriptions.forEach((sub, index) => {
      sub.order = index;
      body[sub.name] = sub;
    });
    updateSubscriptions(body).then(() => {
      props.session.showMessage('应用成功');
    });
  };
  const columns: ColumnsType<SubscriptionInfo> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '仓库地址',
      dataIndex: 'gitRemote',
      key: 'gitRemote',
    },
    {
      title: '目录',
      dataIndex: 'rootDir',
      key: 'rootDir',
    },
    {
      title: '禁用/启用',
      key: 'disabled',
      render: (_, record) => (
          <Checkbox defaultChecked={!record.disabled} onChange={() => {
            record.disabled = !record.disabled;
          }}/>
        )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size='middle'>
          <Tooltip title='取消订阅（不可撤销）'>
            <DeleteOutlined onClick={() => {
              const filtered = subscriptions.filter(sub => sub.name !== record.name);
              setSubscriptions([...filtered]);
            }}/>
          </Tooltip>
          <Tooltip title='获取最新内容'>
            <CloudDownloadOutlined onClick={() => {
              addSubscription({name: record.name, gitPull: true}).then(() => {
                 props.session.showMessage('更新成功！');
              });
            }}/>
          </Tooltip>
        </Space>
      ),
    },
  ];
  const components = {
    body: {
      row: DraggableBodyRow,
    },
  };
  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRow = subscriptions[dragIndex];
      setSubscriptions(
        update(subscriptions, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRow],
          ],
        })
      );
    },
    [subscriptions],
  );
  return (
    <div>
      {
        process.env.REACT_APP_BUILD_PROFILE === 'demo' &&
          <div className={'node-html'}>
              <span className='red-color'>Demo部署环境下，该功能不可用</span>
          </div>
      }
      <DndProvider backend={HTML5Backend}>
        <Table
          columns={columns}
          dataSource={subscriptions}
          components={components}
          onRow={(_, index) => {
            const attr = {
              index,
              moveRow,
            };
            return attr as React.HTMLAttributes<any>;
          }}
        />
      </DndProvider>
      <Button onClick={saveSubscription} style={{float: 'right', marginRight: '1em'}} type='primary'>
        应用
      </Button>
    </div>
  );
}

export default SubscriptionSettingsComponent;

import {Session} from '../../share';
import Config from '../../share/ts/config';
import {Space, Tree, Input, Avatar, List} from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import * as React from 'react';
import {useState} from 'react';
import {getStyles} from '../../share/ts/themes';
import {DraggableCore} from 'react-draggable';
import { LikeOutlined, MessageOutlined, StarOutlined } from '@ant-design/icons';
const {Search} = Input;

export function YangComponent(props: {session: Session, config: Config}) {
  const [fileListWidth, setFileListWidth] = useState(250);
  const treeData: DataNode[] = [
    {
      title: 'parent 1',
      key: '0-0',
      children: [
        {
          title: 'parent 1-0',
          key: '0-0-0',
          disabled: true,
          children: [
            {
              title: 'leaf',
              key: '0-0-0-0',
              disableCheckbox: true,
            },
            {
              title: 'leaf',
              key: '0-0-0-1',
            },
          ],
        },
        {
          title: 'parent 1-1',
          key: '0-0-1',
          children: [{ title: <span style={{ color: '#1890ff' }}>sss</span>, key: '0-0-1-0' }],
        },
      ],
    },
  ];
  const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
    console.log('selected', selectedKeys, info);
  };

  const onCheck: TreeProps['onCheck'] = (checkedKeys, info) => {
    console.log('onCheck', checkedKeys, info);
  };
  const onSearch = (value: string) => console.log(value);
  const data = Array.from({ length: 23 }).map((_, i) => ({
    href: 'https://ant.design',
    title: `ant design part ${i}`,
    avatar: 'https://joeschmoe.io/api/v1/random',
    description:
      'Ant Design, a design language for background applications, is refined by Ant UED Team.',
    content:
      'We supply a series of design principles, practical patterns and high quality design resources ' +
      '(Sketch and Axure), to help people create their product prototypes beautifully and efficiently.',
  }));
  const IconText = ({ icon, text }: { icon: React.FC; text: string }) => (
    <Space>
      {React.createElement(icon)}
      {text}
    </Space>
  );
  return (
    <div style={{height: '100%', flexDirection: 'row', display: 'flex', width: '100%'}}>
      <div style={{width: `${fileListWidth}px`, overflow: 'auto', flexShrink: 0}}>
        <Tree
          checkable
          defaultExpandedKeys={['0-0-0', '0-0-1']}
          defaultSelectedKeys={['0-0-0', '0-0-1']}
          defaultCheckedKeys={['0-0-0', '0-0-1']}
          onSelect={onSelect}
          onCheck={onCheck}
          treeData={treeData}
        />
      </div>
      <DraggableCore key='filelist_drag' onDrag={(_, ui) => {
        setFileListWidth(Math.min(Math.max(fileListWidth + ui.deltaX, 72), 700));
      }}>
        <div className='horizontal-drag' style={{
          ...getStyles(props.session.clientStore, ['theme-bg-secondary'])
        }}></div>
      </DraggableCore>
      <div style={{overflow: 'auto'}}>
        <Search
          placeholder='搜索关键字，可以使用&（且） 、（或）'
          allowClear
          enterButton='Search'
          size='large'
          onSearch={onSearch}
        />
        <List
          itemLayout='vertical'
          size='large'
          pagination={{
            onChange: (page) => {
              console.log(page);
            },
            pageSize: 3,
          }}
          dataSource={data}
          footer={
            <div>
              <b>ant design</b> footer part
            </div>
          }
          renderItem={(item) => (
            <List.Item
              key={item.title}
              actions={[
                <IconText icon={StarOutlined} text='156' key='list-vertical-star-o' />,
                <IconText icon={LikeOutlined} text='156' key='list-vertical-like-o' />,
                <IconText icon={MessageOutlined} text='2' key='list-vertical-message' />,
              ]}
              extra={
                <img
                  width={272}
                  alt='logo'
                  src='https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png'
                />
              }
            >
              <List.Item.Meta
                avatar={<Avatar src={item.avatar} />}
                title={<a href={item.href}>{item.title}</a>}
                description={item.description}
              />
              {item.content}
            </List.Item>
          )}
        />
      </div>
    </div>
  );
}

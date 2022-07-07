import * as React from 'react';
import {useState} from 'react';
import {Session} from '../../share';
import { Button, Dropdown, MenuProps } from 'antd';
import { DownOutlined } from '@ant-design/icons';

function LayoutToolsComponent(props: {session: Session}) {
  const textColor = props.session.clientStore.getClientSetting('theme-text-primary');
  const selectStyle = `opacity(100%) drop-shadow(0 0 0 ${textColor}) brightness(40)`;
  const [layout, setLayout] = useState(props.session.clientStore.getClientSetting('defaultLayout'));
  const operationClick: MenuProps['onClick'] = ({ key }) => {
    props.session.showFilelist = key.includes('left');
    props.session.showPreview = key.includes('right');
    props.session.showHeader = key.includes('top');
    props.session.clientStore.setClientSetting('defaultLayout', key);
    setLayout(key);
    props.session.emit('updateAnyway');
  };
  const items: MenuProps['items'] = [
    {
      key: 'top_left_right',
      label: (
        <img onClick={e => e.preventDefault()}
             src={`${process.env.PUBLIC_URL}/images/top_left_right.png`} height={18} />
      ),
    },
    {
      key: 'full_screen',
      label: (
        <img onClick={e => e.preventDefault()}
             src={`${process.env.PUBLIC_URL}/images/full_screen.png`} height={18} />
      ),
    },
    {
      key: 'top_left',
      label: (
        <img onClick={e => e.preventDefault()}
             src={`${process.env.PUBLIC_URL}/images/top_left.png`} height={18} />
      ),
    },
    {
      key: 'top_right',
      label: (
        <img onClick={e => e.preventDefault()}
             src={`${process.env.PUBLIC_URL}/images/top_right.png`} height={18} />
      ),
    },
    {
      key: 'top',
      label: (
        <img onClick={e => e.preventDefault()}
             src={`${process.env.PUBLIC_URL}/images/top.png`} height={18} />
      ),
    },
    {
      key: 'left',
      label: (
        <img onClick={e => e.preventDefault()}
             src={`${process.env.PUBLIC_URL}/images/left.png`} height={18} />
      ),
    },
    {
      key: 'right',
      label: (
        <img onClick={e => e.preventDefault()}
             src={`${process.env.PUBLIC_URL}/images/right.png`} height={18} />
      ),
    },
    {
      key: 'left_right',
      label: (
        <img onClick={e => e.preventDefault()}
             src={`${process.env.PUBLIC_URL}/images/left_right.png`} height={18} />
      ),
    }
  ];
  const menuProps = {
    items,
    onClick: operationClick,
  };
  return (
    <Dropdown menu={menuProps}>
      <Button>
          <img style={{position: 'relative', top: '2px', filter: selectStyle}}
               onClick={e => e.preventDefault()}
               src={`${process.env.PUBLIC_URL}/images/${layout}.png`} height={18} />
          <DownOutlined />
      </Button>

    </Dropdown>
  );
}

export default LayoutToolsComponent;

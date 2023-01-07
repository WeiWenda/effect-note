import {Dropdown, Menu, MenuProps, message, Modal} from 'antd';
import * as React from 'react';
import $ from 'jquery';
import { useReactToPrint } from 'react-to-print';
import {ExclamationCircleOutlined, MoreOutlined} from '@ant-design/icons';
import {api_utils, DocInfo, Path, Session} from '../../share';
import {encodeHtml} from '../../ts/util';
import {exportAction} from '../../plugins/links/dropdownMenu';

function FileToolsComponent(props: {session: Session, curDocId: number | undefined, onEditBaseInfo: () => void, reloadFunc: (type: string) => void}) {
  const handlePrint = useReactToPrint({
    content: () => props.session.sessionRef.current,
  });
  const docName = props.session.userDocs.find(doc => doc.id === props.curDocId)?.name;
  const operationClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'remove':
        Modal.confirm({
          title: '确认删除当前文档？',
          icon: <ExclamationCircleOutlined />,
          okText: '确认',
          cancelText: '取消',
          onOk: () => {
            api_utils.deleteDocContent(props.curDocId!).then(() => {
              localStorage.removeItem('currentDocId');
              api_utils.getCurrentUserDocs().then(res => {
                props.session.userDocs = res.content;
                props.reloadFunc(key);
              });
            });
          }
        });
        break;
      case 'edit-base-info':
        props.onEditBaseInfo();
        break;
      case 'save':
        props.session.reUploadFile(Path.root(), props.curDocId!).then((docId) => {
          if (docId !== undefined) {
            props.session.emit('save-cloud', {docId: docId});
          } else {
            props.session.showMessage('正在保存，请勿重复保存');
          }
        });
        break;
      case 'export_md':
        exportAction(props.session, Path.root(), 'text/markdown', docName);
        break;
      case 'export_json':
        exportAction(props.session, Path.root(), 'application/json', docName);
        break;
      case 'export_text':
        exportAction(props.session, Path.root(), 'text/plain', docName);
        break;
      case 'export_pdf':
        $('.session-content').css('overflow', 'unset');
        handlePrint();
        $('.session-content').css('overflow', 'auto');
        break;
      default:
        message.info(`Click on item ${key}`);
    }
  };
  const items: any[] = [
    {
      label: '导出',
      key: 'export',
      children: [
        {
          label: '导出为pdf',
          key: 'export_pdf',
        },
        {
          label: '导出为markdown',
          key: 'export_md',
        },
        {
          label: '导出为json（无损导出）',
          key: 'export_json',
        },
        {
          label: '导出为text（兼容WorkFlowy）',
          key: 'export_text',
        }
      ],
    }
  ];
  if (props.curDocId) {
    items.unshift({
        key: 'edit-base-info',
        label: '重命名',
      },
      {
        key: 'remove',
        label: '删除',
      },
      {
        key: 'save',
        label: '保存(Ctrl+s)',
      });
  }
  const menu = (
    <Menu
      onClick={operationClick}
      items={items}
    />
  );
  return (
    <Dropdown overlayStyle={{width: '120px'}} overlay={menu}>
      <MoreOutlined style={{float: 'right', paddingRight: '10px'}} onClick={e => e.preventDefault()}/>
    </Dropdown>
  );
}

export default FileToolsComponent;

import {Dropdown, Menu, MenuProps, message, Modal} from 'antd';
import * as React from 'react';
import $ from 'jquery';
import { useReactToPrint } from 'react-to-print';
import {ExclamationCircleOutlined, MoreOutlined} from '@ant-design/icons';
import {api_utils, DocInfo, Path, Session} from '../../share';
import {encodeHtml} from '../../ts/util';

function FileToolsComponent(props: {session: Session, curDocId: number, onEditBaseInfo: () => void, reloadFunc: (type: string) => void}) {
  const handlePrint = useReactToPrint({
    content: () => props.session.sessionRef.current,
  });
  const operationClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'remove':
        Modal.confirm({
          title: '确认删除当前文档？',
          icon: <ExclamationCircleOutlined />,
          okText: '确认',
          cancelText: '取消',
          onOk: () => {
            api_utils.deleteDocContent(props.curDocId).then(() => {
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
        props.session.reUploadFile(Path.root(), props.curDocId).then((docId) => {
          if (docId !== undefined) {
            props.session.emit('save-cloud', {docId: docId});
          } else {
            props.session.showMessage('正在保存，请勿重复保存');
          }
        });
        break;
      case 'export_json':
        props.session.getCurrentContent(Path.root(), 'application/json').then(content => {
          let tab = window.open('about:blank', '_blank');
          tab?.document.write('<html><body>' +
            '<pre style="word-wrap: break-word; white-space: pre-wrap;">' + encodeHtml(content) + '</pre></body></html>');
          tab?.document.close();
        });
        break;
      case 'export_pdf':
        $('.session-content').css('overflow', 'unset');
        handlePrint();
        $('.session-content').css('overflow', 'auto');
        break;
      case 'export_text':
        props.session.getCurrentContent(Path.root(), 'text/plain').then(content => {
          let tab = window.open('about:blank', '_blank');
          tab?.document.write('<html><body>' +
            '<pre style="word-wrap: break-word; white-space: pre-wrap;">' + encodeHtml(content) + '</pre></body></html>');
          tab?.document.close();
        });
        break;
      default:
        message.info(`Click on item ${key}`);
    }
  };
  const menu = (
    <Menu
      onClick={operationClick}
      items={[
        {
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
        },
        {
          label: '导出',
          key: 'export',
          children: [
            {
              label: '导出为pdf',
              key: 'export_pdf',
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
      ]}
    />
  );
  return (
    <Dropdown overlayStyle={{width: '120px'}} overlay={menu}>
      <MoreOutlined style={{float: 'right', paddingRight: '10px'}} onClick={e => e.preventDefault()}/>
    </Dropdown>
  );
}

export default FileToolsComponent;

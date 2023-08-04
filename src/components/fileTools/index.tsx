import {Dropdown, Menu, MenuProps, message, Modal} from 'antd';
import * as React from 'react';
import $ from 'jquery';
import { useReactToPrint } from 'react-to-print';
import {ExclamationCircleOutlined, MoreOutlined} from '@ant-design/icons';
import {api_utils, DocInfo, Path, Session} from '../../share';
import {downloadFile, encodeHtml} from '../../ts/util';
import {exportAction, shareAction} from '../../plugins/links/dropdownMenu';
import {TagsPlugin} from '../../plugins/tags';
import {useNavigate} from 'react-router-dom';

function FileToolsComponent(props:  React.PropsWithChildren<{
  session: Session, curDocId: number,
  trigger?: ('click' | 'hover' | 'contextMenu')[],
  tagPlugin?: TagsPlugin}>) {
  const navigate = useNavigate();
  const handlePrint = useReactToPrint({
    content: () => props.session.sessionRef.current,
  });
  const docName = props.session.userDocs.find(doc => doc.id === props.curDocId)?.name;
  const operationClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.preventDefault();
    domEvent.stopPropagation();
    switch (key) {
      case 'reload':
        props.session.clientStore.setDocSetting('loaded', false);
        window.location.reload();
        break;
      case 'open-in-browser':
        window.open(`/note/${props.curDocId}`, '_blank');
        break;
      case 'remove':
        Modal.confirm({
          title: '确认删除当前文档？',
          icon: <ExclamationCircleOutlined />,
          okText: '确认',
          cancelText: '取消',
          onOk: () => {
            api_utils.deleteDocContent(props.curDocId).then(() => {
              props.session.clientStore.setClientSetting('curDocId', -1);
              navigate(`/note/-1`);
            }).catch(e => {
              props.session.showMessage(e, {warning: true});
            });
          }
        });
        break;
      case 'edit-base-info':
        const docInfo = props.session.userDocs.find(d => d.id === props.curDocId);
        if (docInfo && props.curDocId !== -1) {
          props.session.emit('openModal', 'noteInfo', {docInfo: docInfo});
        }
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
      case 'export_url':
        shareAction(props.session, Path.root(), 'application/json');
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
      case 'export_ics':
        props.tagPlugin?.listEvents().then(content => {
          props.session.exportModalContent = content;
          props.session.emit('openModal', 'export');
          props.session.exportFileFunc = () => {
            downloadFile(docName!, content, 'text/calendar');
          };
          props.session.emit('updateAnyway');
        });
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
  const items: MenuProps['items'] = [{
    key: 'open-in-browser',
    label: '在新页面打开',
  },
  {
    key: 'reload',
    label: '重新加载',
  }];
  if (props.curDocId !== -1) {
    items.push({
        key: 'edit-base-info',
        label: '重命名',
      },
      {
        key: 'remove',
        label: '删除',
      },
      {
        key: 'save',
        label: '保存',
      });
  }
  if (!props.trigger) {
    items.push({
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
          label: '生成分享链接',
          key: 'export_url',
        },
        {
          label: '导出为json（用于EffectNote导入）',
          key: 'export_json',
        },
        {
          label: '导出为text（用于WorkFlowy导入）',
          key: 'export_text',
        },
        {
          label: '导出为ics（用于日历导入）',
          key: 'export_ics',
        },
      ],
    });
  }
  return (
    <Dropdown overlayStyle={{width: '120px'}} trigger={props.trigger || ['hover']}
      menu={{
        items,
        onClick: operationClick
      }}>
      {props.children}
    </Dropdown>
  );
}

export default FileToolsComponent;

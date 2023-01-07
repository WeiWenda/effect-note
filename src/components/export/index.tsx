import {Session} from '../../share';
import {Button, Space} from 'antd';
import {copyToClipboard} from '../index';

export function ExportComponent(props: {session: Session}) {
  return (
    <div style={{width: '100%'}} >
      <textarea readOnly className={'export-textarea'} value={props.session.exportModalContent} />
      <div style={{display: 'flex', justifyContent: 'flex-end'}}>
        <Space>
          <Button onClick={() => {
            copyToClipboard(props.session.exportModalContent);
            props.session.showMessage('操作成功');
          }}>复制到粘贴板</Button>
          <Button onClick={props.session.exportFileFunc}>下载文件</Button>
        </Space>
      </div>
    </div>
  );
}

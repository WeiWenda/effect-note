import {DatePicker, Space} from 'antd';
import dayjs from 'dayjs';
import {getTaskStatus} from '../links/dropdownMenu';

export function TaskMenuComponent(props: {tags: string[], setTags: (newTags: string[]) => void}) {
  const getDateString = (prefix: string) => {
    const dateString = props.tags.find((t: string) => t.startsWith(prefix))?.split(prefix)[1];
    return dateString ? dayjs(dateString, 'YYYY-MM-DD HH:mm:ss') : undefined;
  };
  const setTags = (prefix: string, dateString: string) => {
      let filteredTags = props.tags?.filter(t => !t.startsWith(prefix))
        .filter(t => !['Delay', 'Done', 'Todo', 'Doing'].includes(t)) || [];
      if (dateString) {
        filteredTags = [prefix + dateString,  ...filteredTags];
      }
      const newStatus = getTaskStatus(filteredTags);
      if (newStatus) {
        filteredTags = [newStatus, ...filteredTags];
      }
      props.setTags(filteredTags);
  };
  return (
    <Space style={{display: 'flex', flexDirection: 'column'}}>
      <div>
        <span>创建时间：</span>
        <DatePicker showTime={true}
                    value={getDateString('create: ')}
                    placeholder='创建时间' onChange={(_, dateString) => {
          setTags('create: ', dateString);
        }}></DatePicker>
      </div>
      <div>
        <span>截止时间：</span>
        <DatePicker showTime={true}
                    value={getDateString('due: ')}
                    placeholder='截止时间' onChange={(_, dateString) => {
          setTags('due: ', dateString);
        }}></DatePicker>
      </div>
      <div>
        <span>开始时间：</span>
        <DatePicker showTime={true}
                    value={getDateString('start: ')}
                    placeholder='开始时间' onChange={(_, dateString) => {
          setTags('start: ', dateString);
        }}></DatePicker>
      </div>
      <div>
        <span>完成时间：</span>
        <DatePicker showTime={true}
                    value={getDateString('end: ')}
                    placeholder='完成时间' onChange={(_, dateString) => {
          setTags('end: ', dateString);
        }}></DatePicker>
      </div>
    </Space>
  );
}

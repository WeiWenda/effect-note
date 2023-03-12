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
        .filter((t: string) => !['Delay', 'Done', 'Todo', 'Doing'].includes(t)) || [];
      if (dateString) {
        filteredTags = [prefix + dateString,  ...filteredTags];
      }
      filteredTags = [getTaskStatus(filteredTags)!, ...filteredTags];
      props.setTags(filteredTags);
  };
  return (
    <Space style={{display: 'flex', flexDirection: 'column'}}>
      <DatePicker showTime={true}
                  defaultValue={getDateString('due: ')}
                  placeholder='截止时间' onChange={(_, dateString) => {
        setTags('due: ', dateString);
      }}></DatePicker>
      <DatePicker showTime={true} defaultValue={getDateString('end: ')}
                  placeholder='完成时间' onChange={(_, dateString) => {
        setTags('end: ', dateString);
      }}></DatePicker>
      <DatePicker showTime={true} defaultValue={getDateString('start: ')}
                  placeholder='开始时间' onChange={(_, dateString) => {
        setTags('start: ', dateString);
      }}></DatePicker>
    </Space>
  );
}

import './styles.css';

interface Props {
  content: string;
}

export default function SourceFileCell({ content }: Props) {
  return (
    <div
      className='dataloom-source-file-cell'
    >
      {content === '' && content}
    </div>
  );
}

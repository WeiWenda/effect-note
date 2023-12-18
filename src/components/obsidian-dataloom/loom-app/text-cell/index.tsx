import './styles.css';

interface Props {
  value: string;
}

export default function TextCell({ value }: Props) {
  return (
    <div className='dataloom-text-cell'>
      {value}
    </div>
  );
}

import Button from '../../shared/button';
import Icon from '../../shared/icon';

import './styles.css';

interface Props {
  onClick: () => void;
}

export default function NewColumnButton({ onClick }: Props) {
  return (
    <div className='dataloom-new-column'>
      <Button
        icon={<Icon lucideId='Plus' />}
        ariaLabel='New column'
        onClick={() => onClick()}
      />
    </div>
  );
}

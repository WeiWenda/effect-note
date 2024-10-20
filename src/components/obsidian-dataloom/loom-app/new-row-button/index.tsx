import Button from '../../shared/button';
import Icon from 'src/components/obsidian-dataloom/shared/icon';

interface Props {
  onClick: () => void;
}

export default function NewRowButton({ onClick }: Props) {
  return (
    <Button
      icon={<Icon lucideId='Plus' />}
      ariaLabel='New row'
      onClick={() => onClick()}
    >
      New
    </Button>
  );
}

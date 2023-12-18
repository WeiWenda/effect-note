import { useOverflow } from 'src/components/obsidian-dataloom/shared/spacing/hooks';

interface Props {
  isDisabled: boolean;
  value: string;
}

export default function BodyCell({ value, isDisabled }: Props) {
  const overflowClassName = useOverflow(false, {
    ellipsis: true,
  });

  let className = overflowClassName;
  if (isDisabled) className += ' dataloom-disabled';
  return <td className={className}>{value}</td>;
}

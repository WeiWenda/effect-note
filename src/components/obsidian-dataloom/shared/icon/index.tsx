import React from 'react';
import { icons } from 'lucide-react';
import './styles.css';

interface Props {
  ariaLabel?: string;
  lucideId: keyof Omit<typeof icons, 'createReactComponent'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

export default function Icon({
  ariaLabel,
  lucideId,
  size = 'sm',
  color,
}: Props) {
  let className = 'dataloom-svg ';
  if (size === 'sm') {
    className += 'dataloom-svg--sm';
  } else if (size === 'md') {
    className += 'dataloom-svg--md';
  } else if (size === 'lg') {
    className += 'dataloom-svg--lg';
  } else if (size === 'xl') {
    className += 'dataloom-svg--xl';
  }
  const LucideIcon = icons[lucideId];
  // const LucideIcon = lazy(dynamicIconImports[lucideId]);
  // const fallback = <div className={className}/>;
  return (
    <div
      aria-label={ariaLabel}
    >
      <LucideIcon className={className} color={color}/>
      {/*<Suspense fallback={fallback}>*/}
      {/*  <LucideIcon className={className} color={color}/>*/}
      {/*</Suspense>*/}
    </div>
  );
}

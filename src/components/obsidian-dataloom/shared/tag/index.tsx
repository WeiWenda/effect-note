import Stack from '../stack';
import Button from '../button';
import Padding from '../padding';

import { Color } from '../loom-state/types/loom-state';
import { findColorClassName } from '../color';
import { useAppSelector } from '../../redux/hooks';
import {Tag as AntdTag } from 'antd';

import './styles.css';
import Icon from '../icon';

interface Props {
  id?: string;
  maxWidth?: string;
  content: string;
  color: Color;
  showRemoveButton?: boolean;
  onRemoveClick?: (id: string) => void;
  onClick?: (id: string) => void;
}

export default function Tag({
  id,
  color,
  maxWidth,
  content,
  showRemoveButton,
  onRemoveClick,
}: Props) {
  const { isDarkMode } = useAppSelector((state) => state.global);

  let tagClassName = 'dataloom-tag';
  tagClassName += ' ' + findColorClassName(isDarkMode, color);

  if (onRemoveClick !== undefined && id === undefined) {
    throw new Error(
      'An id must defined when the onRemoveClick handler is present.'
    );
  }

  let contentClassName = 'dataloom-tag-content';
  if (maxWidth !== undefined) {
    contentClassName += ' ' + 'dataloom-overflow--ellipsis';
  }
  return (
    <div className={tagClassName}>
      <Stack spacing='sm' justify='center' isHorizontal>
        {
          color.startsWith('antd') &&
            <AntdTag color={color.substring(5)}>
              {content}
            </AntdTag>
        }
        {
          !color.startsWith('antd') &&
          <div
            className={contentClassName}
            style={{
              maxWidth,
            }}
          >
            {content}
          </div>
        }
        {showRemoveButton && (
          <Padding width='max-content'>
            <Button
              size='sm'
              icon={<Icon lucideId='X' />}
              onClick={() => {
                if (id && onRemoveClick) {
                  onRemoveClick(id);
                }
              }}
            />
          </Padding>
        )}
      </Stack>
    </div>
  );
}

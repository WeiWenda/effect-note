import Tag from '../../../shared/tag';
import Stack from '../../../shared/stack';
import Button from '../../../shared/button';

import { Color } from '../../../shared/loom-state/types/loom-state';
import Padding from '../../../shared/padding';

interface Props {
  content: string;
  color: Color;
  onTagAdd: (content: string, color: Color) => void;
}

export default function CreateTag({ content, color, onTagAdd }: Props) {
  return (
    <div className='dataloom-create-tag'>
      <Button
        variant='text'
        isFullWidth
        onClick={() => onTagAdd(content, color)}
      >
        <Padding px='md'>
          <Stack spacing='sm' isHorizontal>
            <div>Create</div>
            <Tag content={content} color={color} maxWidth='120px' />
          </Stack>
        </Padding>
      </Button>
    </div>
  );
}

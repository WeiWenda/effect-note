import Tag from '../../shared/tag';
import Wrap from 'src/components/obsidian-dataloom/shared/wrap';

import { Tag as TagType } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';

import './styles.css';

interface Props {
  cellTags: TagType[];
}

export default function MultiTagCell({ cellTags }: Props) {
  return (
    <div className='dataloom-multi-tag-cell'>
      <Wrap>
        {cellTags.map((tag: TagType) => (
          <Tag key={tag.id} content={tag.content} color={tag.color} />
        ))}
      </Wrap>
    </div>
  );
}

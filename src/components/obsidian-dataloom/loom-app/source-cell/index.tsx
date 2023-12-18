import { SourceType } from '../../shared/loom-state/types/loom-state';
import Bubble from '../../shared/bubble';
import Icon from '../../shared/icon';
import { getIconIdForSourceType } from '../../shared/icon/utils';
import { ObsidianPropertyType } from '../../shared/frontmatter/types';

interface Props {
  content: string;
  sourceType: SourceType;
  propertyType?: ObsidianPropertyType;
}

export default function SourceCell({
  content,
  sourceType,
  propertyType,
}: Props) {
  return (
    <div className='dataloom-source-cell'>
      <Bubble
        variant='no-fill'
        icon={
          <Icon
            lucideId={getIconIdForSourceType(sourceType, {
              propertyType,
            })}
          />
        }
        value={content}
      />
    </div>
  );
}

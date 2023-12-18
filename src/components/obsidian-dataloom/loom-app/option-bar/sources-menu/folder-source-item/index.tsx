import Bubble from 'src/components/obsidian-dataloom/shared/bubble';
import Button from 'src/components/obsidian-dataloom/shared/button';
import Icon from 'src/components/obsidian-dataloom/shared/icon';
import Stack from 'src/components/obsidian-dataloom/shared/stack';
import SourceItem from '../source-item';

import { SourceType } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';
import { getIconIdForSourceType } from 'src/components/obsidian-dataloom/shared/icon/utils';
import Flex from 'src/components/obsidian-dataloom/shared/flex';

interface Props {
  id: string;
  content: string;
  type: SourceType;
  onDelete: (id: string) => void;
}

export default function FolderSourceItem({
  id,
  content,
  type,
  onDelete,
}: Props) {
  return (
    <SourceItem>
      <Flex justify='space-between' align='center' height='100%'>
        <Stack isHorizontal spacing='sm'>
          <Bubble
            icon={<Icon lucideId={getIconIdForSourceType(type)} />}
            variant='no-fill'
            value={content}
          />
        </Stack>
        <Button
          icon={<Icon lucideId='Trash' />}
          ariaLabel='Delete source'
          onClick={() => onDelete(id)}
        />
      </Flex>
    </SourceItem>
  );
}

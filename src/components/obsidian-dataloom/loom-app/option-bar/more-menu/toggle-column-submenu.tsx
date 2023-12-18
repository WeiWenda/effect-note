import Padding from 'src/components/obsidian-dataloom/shared/padding';
import Stack from 'src/components/obsidian-dataloom/shared/stack';
import Submenu from 'src/components/obsidian-dataloom/shared/submenu';
import Switch from 'src/components/obsidian-dataloom/shared/switch';
import Text from 'src/components/obsidian-dataloom/shared/text';
import Wrap from 'src/components/obsidian-dataloom/shared/wrap';
import { Column } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';

interface Props {
  columns: Column[];
  onColumnToggle: (id: string, isVisible: boolean) => void;
  onBackClick: () => void;
}

export default function ToggleColumnSubmenu({
  columns,
  onColumnToggle,
  onBackClick,
}: Props) {
  return (
    <Submenu title='Toggle' onBackClick={onBackClick}>
      <Padding py='sm'>
        <Stack spacing='md'>
          {columns.map((column) => {
            const { id, content, isVisible } = column;
            return (
              <Wrap
                key={id}
                justify='space-between'
                spacingX='4xl'
              >
                <Text value={content} maxWidth='250px' />
                <Switch
                  value={isVisible}
                  onToggle={() =>
                    onColumnToggle(id, !isVisible)
                  }
                />
              </Wrap>
            );
          })}
        </Stack>
      </Padding>
    </Submenu>
  );
}

import Submenu from '../../shared/submenu';
import Stack from 'src/components/obsidian-dataloom/shared/stack';
import Padding from 'src/components/obsidian-dataloom/shared/padding';
import MenuItem from 'src/components/obsidian-dataloom/shared/menu-item';
import Divider from 'src/components/obsidian-dataloom/shared/divider';

interface Props {
  title: string;
  selectedKey: string | null;
  frontmatterKeys: {
    value: string;
    isSelectable: boolean;
  }[];
  onBackClick: () => void;
  onFrontmatterKeyChange: (key: string | null) => void;
}

export default function FrontmatterKeySubmenu({
  title,
  selectedKey,
  frontmatterKeys,
  onBackClick,
  onFrontmatterKeyChange,
}: Props) {
  return (
    <Submenu title={title} onBackClick={onBackClick}>
      <Padding pt='md'>
        <Stack spacing='sm'>
          {frontmatterKeys.map((key) => {
            const { value, isSelectable } = key;
            const isSelected = selectedKey === value;

            return (
              <MenuItem
                key={value}
                isDisabled={!isSelectable}
                isSelected={isSelected}
                name={value}
                onClick={() => onFrontmatterKeyChange(value)}
              />
            );
          })}
          <Divider />
          <MenuItem
            name='Clear'
            onClick={() => onFrontmatterKeyChange(null)}
          />
        </Stack>
      </Padding>
    </Submenu>
  );
}

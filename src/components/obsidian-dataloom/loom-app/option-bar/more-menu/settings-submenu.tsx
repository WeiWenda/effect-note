import Padding from 'src/components/obsidian-dataloom/shared/padding';
import Stack from 'src/components/obsidian-dataloom/shared/stack';
import Submenu from 'src/components/obsidian-dataloom/shared/submenu';
import Switch from 'src/components/obsidian-dataloom/shared/switch';
import Text from 'src/components/obsidian-dataloom/shared/text';

interface Props {
  showCalculationRow: boolean;
  onCalculationRowToggle: (value: boolean) => void;
  onBackClick: () => void;
}

export default function SettingsSubmenu({
  showCalculationRow,
  onCalculationRowToggle,
  onBackClick,
}: Props) {
  return (
    <Submenu title='Settings' onBackClick={onBackClick}>
      <Padding px='lg' py='md'>
        <Stack isHorizontal spacing='lg'>
          <Text value='Calculation row' />
          <Switch
            value={showCalculationRow}
            onToggle={onCalculationRowToggle}
          />
        </Stack>
      </Padding>
    </Submenu>
  );
}

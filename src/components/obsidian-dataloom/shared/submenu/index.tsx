import Button from '../button';
import Divider from '../divider';
import Icon from '../icon';
import Padding from '../padding';
import Stack from '../stack';

interface Props {
  title: string;
  showBackButton?: boolean;
  children: React.ReactNode;
  onBackClick: () => void;
}

export default function Submenu({
  title,
  showBackButton = true,
  children,
  onBackClick,
}: Props) {
  return (
    <Padding p='sm'>
      <Stack spacing='md'>
        <Stack isHorizontal>
          {showBackButton && (
            <Button
              icon={<Icon lucideId='ArrowLeft' />}
              onClick={() => {
                onBackClick();
              }}
            />
          )}
          <Padding pr='md'>{title}</Padding>
        </Stack>
        <Divider />
      </Stack>
      {children}
    </Padding>
  );
}

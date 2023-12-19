import Padding from 'src/components/obsidian-dataloom/shared/padding';
import MenuItem from 'src/components/obsidian-dataloom/shared/menu-item';
// import ExportModal from 'src/obsidian/modal/export-modal';
import { useAppMount } from '../../app-mount-provider';
import { isSmallScreenSize } from 'src/components/obsidian-dataloom/shared/render/utils';
// import ImportModal from 'src/obsidian/modal/import-modal';
import { useLoomState } from '../../loom-state-provider';

interface Props {
  onClose: () => void;
  onSettingsClick: () => void;
  onToggleColumnClick: () => void;
  onFilterClick: () => void;
  onSourcesClick: () => void;
}

export default function BaseContent({
  onToggleColumnClick,
  onFilterClick,
  onSettingsClick,
  onSourcesClick,
  onClose,
}: Props) {
  const { loomState } = useLoomState();

  const isSmallScreen = isSmallScreenSize();
  return (
    <Padding p='sm'>
      {/*{isSmallScreen && (*/}
      {/*  <MenuItem*/}
      {/*    lucideId='Filter'*/}
      {/*    name='Sources'*/}
      {/*    onClick={onSourcesClick}*/}
      {/*  />*/}
      {/*)}*/}
      {isSmallScreen && (
        <MenuItem
          lucideId='Filter'
          name='Filter'
          onClick={onFilterClick}
        />
      )}
      <MenuItem
        lucideId='EyeOff'
        name='Toggle'
        onClick={onToggleColumnClick}
      />
      <MenuItem
        lucideId='Import'
        name='Import'
        onClick={() => {
          onClose();
          // new ImportModal(app, loomFile, loomState).open();
        }}
      />
      <MenuItem
        lucideId='Download'
        name='Export'
        onClick={() => {
          onClose();
          // new ExportModal(app, loomFile, loomState).open();
        }}
      />
      <MenuItem
        lucideId='Wrench'
        name='Settings'
        onClick={onSettingsClick}
      />
    </Padding>
  );
}

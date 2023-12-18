import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DataLoomSettings {
  shouldDebug: boolean;
  createAtObsidianAttachmentFolder: boolean;
  customFolderForNewFiles: string;
  removeMarkdownOnExport: boolean;
  defaultEmbedWidth: string;
  defaultEmbedHeight: string;
  hasMigratedTo800: boolean;
  showWelcomeModal: boolean;
  showWhatsNewModal: boolean;
  defaultFrozenColumnCount: number;
  pluginVersion: string;
}

export const DEFAULT_SETTINGS: DataLoomSettings = {
  shouldDebug: false,
  createAtObsidianAttachmentFolder: false,
  customFolderForNewFiles: '',
  removeMarkdownOnExport: true,
  defaultEmbedWidth: '100%',
  defaultEmbedHeight: '340px',
  hasMigratedTo800: false,
  showWelcomeModal: true,
  showWhatsNewModal: true,
  defaultFrozenColumnCount: 1,
  pluginVersion: '',
};

interface GlobalState {
  settings: DataLoomSettings;
  isDarkMode: boolean;
  pluginVersion: string;
}

const initialState: GlobalState = {
  settings: DEFAULT_SETTINGS,
  isDarkMode: false,
  pluginVersion: '',
};

const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    setDarkMode(state, action: PayloadAction<boolean>) {
      state.isDarkMode = action.payload;
    },
    setSettings(state, action: PayloadAction<DataLoomSettings>) {
      state.settings = action.payload;
    },
    setPluginVersion(state, action: PayloadAction<string>) {
      state.pluginVersion = action.payload;
    },
  },
});

export const { setDarkMode, setSettings, setPluginVersion } =
  globalSlice.actions;
export default globalSlice.reducer;

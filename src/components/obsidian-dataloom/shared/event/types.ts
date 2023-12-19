export type DataLoomEvent =
  | 'add-column'
  | 'delete-column'
  | 'add-row'
  | 'delete-row'
  | 'app-refresh-by-state'
  | 'app-refresh-by-file'
  | 'file-frontmatter-change'
  | 'file-delete'
  | 'folder-delete'
  | 'folder-rename'
  | 'file-rename'
  | 'file-create'
  | 'global-click'
  | 'global-keydown'
  | 'download-csv'
  | 'download-markdown'
  | 'property-type-change'
  | 'clear-menu-trigger-focus';

export type EventCallback = (...data: any[]) => void;

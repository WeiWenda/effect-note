import { ObsidianPropertyType } from '../frontmatter/types';
import { CellType, SourceType } from '../loom-state/types/loom-state';

export const getIconIdForSourceType = (
  type: SourceType,
  options?: {
    propertyType?: ObsidianPropertyType;
  }
) => {
  const { propertyType } = options ?? {};

  if (type === SourceType.FOLDER) {
    return 'Folder';
  } else if (type === SourceType.FRONTMATTER) {
    switch (propertyType) {
      case ObsidianPropertyType.TEXT:
        return 'Text';
      case ObsidianPropertyType.ALIASES:
        return 'CornerUpRight';
      case ObsidianPropertyType.TAGS:
        return 'Tags';
      case ObsidianPropertyType.MULTITEXT:
        return 'List';
      case ObsidianPropertyType.DATE:
        return 'Calendar';
      case ObsidianPropertyType.DATETIME:
        return 'Clock';
      case ObsidianPropertyType.CHECKBOX:
        return 'CheckSquare';
      case ObsidianPropertyType.NUMBER:
        return 'Hash';
      default:
        throw new Error(`Property type not handled: ${propertyType}`);
    }
  }
  return 'Text';
};

export const getIconIdForCellType = (type: CellType) => {
  switch (type) {
    case CellType.TEXT:
      return 'Text';
    case CellType.EMBED:
      return 'Link';
    case CellType.SOURCE_FILE:
    case CellType.FILE:
      return 'File';
    case CellType.NUMBER:
      return 'Hash';
    case CellType.CHECKBOX:
      return 'CheckSquare';
    case CellType.CREATION_TIME:
    case CellType.LAST_EDITED_TIME:
      return 'Clock2';
    case CellType.TAG:
      return 'Tag';
    case CellType.MULTI_TAG:
      return 'Tags';
    case CellType.DATE:
      return 'Calendar';
    case CellType.SOURCE:
      return 'Rss';
    default:
      return 'Text';
  }
};

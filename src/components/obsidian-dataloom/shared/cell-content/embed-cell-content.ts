import { isObsidianLink } from '../link-and-path/link-predicates';
import { isTwitterLink, isYouTubeLink } from '../match';

/**
 * Gets the embed cell content
 * @param renderMarkdown Whether not we should render markdown
 * @param isExternalLink Whether or not the link is external
 * @param value The value of the cell
 */
export const getEmbedCellContent = (
  pathOrUrl: string,
  options?: {
    shouldRemoveMarkdown?: boolean;
    isExternal?: boolean;
    isExport?: boolean;
  }
) => {
  const {
    shouldRemoveMarkdown = false,
    isExternal = false,
    isExport = false,
  } = options ?? {};

  if (shouldRemoveMarkdown) return pathOrUrl;
  if (pathOrUrl === '') return pathOrUrl;

  if (isExternal) {
    if (
      isObsidianLink(pathOrUrl) ||
      isTwitterLink(pathOrUrl) ||
      isYouTubeLink(pathOrUrl)
    ) {
      return `![](${pathOrUrl})`;
    }
    return `<a target="_blank" href='${pathOrUrl}'>${pathOrUrl}</a>`;
    // return `![](${pathOrUrl})`;
    // return `<iframe src='${pathOrUrl}'></iframe>`;
  }

  // Export will use the normal embedded image syntax
  if (isExport) return `![[${pathOrUrl}]]`;
  return pathOrUrl;
};

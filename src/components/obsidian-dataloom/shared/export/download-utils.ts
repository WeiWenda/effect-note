import Moment from 'moment';
import { ExportType } from './types';
import { LOOM_EXTENSION } from 'src/components/obsidian-dataloom/data/constants';

export const getBlobTypeForExportType = (type: ExportType) => {
  switch (type) {
    case ExportType.CSV:
      return 'text/csv';
    case ExportType.MARKDOWN:
      return 'text/markdown';
    default:
      throw new Error(`Unknown export type: ${type}`);
  }
};

export const getExportFileName = (filePath: string) => {
  const replaceExtension = filePath.replace(`.${LOOM_EXTENSION}`, "");
  const replaceSlash = replaceExtension.replace(/\//g, '-');
  const replaceSpaces = replaceSlash.replace(/ /g, '_');
  const timestamp = Moment().format('YYYY_MM_DD-HH_mm_ss');
  return replaceSpaces + '-' + timestamp;
};

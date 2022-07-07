/* Utilities for stuff related to being in the browser */
import {saveAs} from 'file-saver';
import {Session} from '../share';

export function downloadFile(filename: string, content: string, mimetype: string) {
    const blob = new Blob([content], {type: `${mimetype};charset=utf-8`});
    saveAs(blob, filename);
}

export function encodeHtml(content: string) {
    return content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

export async function exportFile(session: Session, type = 'json') {
    const filename = session.document.name === '' ?
        `vimflowy.${type}` :
        `${session.document.name}.${type}`;
    // Infer mimetype from file extension
    const mimetype = mimetypeLookup(filename);
    if (!mimetype) {
        throw new Error('Invalid export type');
    }
    const content = await session.exportContent(mimetype);
    downloadFile(filename, content, mimetype);
}

export function mimetypeLookup(filename: string): string | undefined {
    const parts = filename.split('.');
    const extension = parts.length > 1 ? parts[parts.length - 1] : '';
    const extensionLookup: {[key: string]: string} = {
        'opml': 'text/x-opml',
        'json': 'application/json',
        'txt': 'text/plain',
        '': 'text/plain',
    };
    return extensionLookup[extension.toLowerCase()];
}

export function mimetypeLookupByContent(content: string): string | undefined {
    const trimed = content.trim();
    if (trimed.startsWith('<')) {
        return undefined;
    } else if (trimed.startsWith('-')) {
        return 'text/plain';
    } else if (trimed.startsWith('{')) {
        return 'application/json';
    } else {
        return undefined;
    }
}

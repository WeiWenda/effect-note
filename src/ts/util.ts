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

export const htmlTypes: Array<string> = [
    'div',
    'img',
    'table'
];

const htmlRegexParts: Array<string> = [];
htmlRegexParts.push(
  `<span class='([^']*?)'>([^<]*?)</span>`
);
htmlRegexParts.push(
  `<span(.|\\n)*/>`
);
htmlRegexParts.push(
  `<a(.|\\n)*?href="(.*?)">([^<]*?)</a>`
);
htmlTypes.forEach((htmltype) => {
    htmlRegexParts.push(
      `<${htmltype}(.|\\n)*>(.*?)</${htmltype}>`
    );
    // self-closing
    htmlRegexParts.push(
      `<${htmltype}(.|\\n)*/>`
    );
});
export const htmlRegex = '(' + htmlRegexParts.map((part) => '(' + part + ')').join('|') + ')';

export function onlyUnique(value: string, index: number, self: string[]) {
    return self.indexOf(value) === index;
}

export function mimetypeLookup(filename: string): string | undefined {
    const parts = filename.split('.');
    const extension = parts.length > 1 ? parts[parts.length - 1] : '';
    const extensionLookup: {[key: string]: string} = {
        'pdf': 'application/pdf',
        'md': 'text/markdown',
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
    } else if (trimed.startsWith('{')) {
        return 'application/json';
    } else if (trimed.startsWith('-') || trimed.split('-').length > 5) {
        return 'text/plain';
    } else {
        return undefined;
    }
}

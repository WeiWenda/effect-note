import * as _ from 'lodash';

import { SerializedBlock } from './types';
import * as default_data from './hello.json';
import KeyMappings, { HotkeyMapping } from './keyMappings';
import { motionKey } from './keyDefinitions';
import { SINGLE_LINE_MOTIONS } from './definitions/motions';
import Config from './config';

// TODO: 'next-sentence': [[')']]
// TODO: 'prev-sentence': [['(']]

export const NORMAL_MOTION_MAPPINGS: HotkeyMapping = {
  'motion-left': [['left'], ['h']],
  'motion-right': [['right'], ['l']],
  'motion-up': [['up'], ['k']],
  'motion-down': [['down'], ['j']],
  'motion-line-beginning': [['home'], ['0'], ['^']],
  'motion-line-end': [['end'], ['$']],
  'motion-word-beginning': [['b']],
  'motion-word-end': [['e']],
  'motion-word-next': [['w']],
  'motion-Word-beginning': [['B']],
  'motion-Word-end': [['E']],
  'motion-Word-next': [['W']],

  'motion-visible-beginning': [['g', 'g']],
  'motion-visible-end': [['G'], ['g', 'G']],
  'motion-parent': [['g', 'p']],
  'motion-next-sibling': [['}']],
  'motion-prev-sibling': [['{']],
  // NOTE: should these work in insert mode also?
  'motion-find-next-char': [['f']],
  'motion-find-prev-char': [['F']],
  'motion-to-next-char': [['t']],
  'motion-to-prev-char': [['T']],
};

export const INSERT_MOTION_MAPPINGS: HotkeyMapping = {
  'motion-left': [['left']],
  'motion-right': [['right']],
  'motion-up': [['up']],
  'motion-down': [['down']],
  'motion-line-beginning': [['home'], ['ctrl+a']],
  'motion-line-end': [['end'], ['ctrl+e']],
  'motion-word-beginning': [['alt+b'], ['alt+left']],
  'motion-word-end': [],
  'motion-word-next': [['alt+f'], ['alt+right']],
  'motion-Word-beginning': [],
  'motion-Word-end': [],
  'motion-Word-next': [],

  'motion-visible-beginning': [['meta+home']],
  'motion-visible-end': [['meta+end']],
  'motion-parent': [['ctrl+g', 'p']],
  'motion-next-sibling': [['alt+down']],
  'motion-prev-sibling': [['alt+up']],
};

export const NORMAL_MODE_MAPPINGS: HotkeyMapping = Object.assign({
  'move-cursor-normal': [[motionKey]],
  'toggle-help': [['?']],
  'enter-visual-mode': [['v']],
  'enter-visual-line-mode': [['V']],
  'enter-insert-before-cursor': [['i']],
  'enter-insert-after-cursor': [['a']],
  'enter-insert-line-beginning': [['I']],
  'enter-insert-line-end': [['A']],
  'enter-insert-below-line': [['o']],
  'enter-insert-above-line': [['O']],
  'visit-link': [['g', 'x']],
  'fold-toggle': [['z']],
  'fold-open': [],
  'fold-close': [],
  'replace-char': [['r']],
  'delete-blocks': [['d', 'd']],
  'delete-motion': [['d', motionKey]],
  'change-line': [['c', 'c']],
  'change-to-line-end': [['C']],
  'change-blocks': [['c', 'r']],
  'change-motion': [['c', motionKey]],
  'yank-line': [['y', 'y']],
  'yank-to-line-end': [['Y']],
  'yank-blocks': [['y', 'r']],
  'yank-motion': [['y', motionKey]],
  'yank-clone': [['y', 'c']],
  'normal-delete-char': [['x']],
  'normal-delete-char-before': [['X']],
  'change-char': [['s']],
  'delete-to-line-beginning': [],
  'delete-to-line-end': [['D']],
  'delete-to-word-beginning': [],
  'paste-after': [['p']],
  'paste-before': [['P']],
  'join-line': [['J']],
  'split-line': [['K']],
  'scroll-down': [['page down'], ['ctrl+d']],
  'scroll-up': [['page up'], ['ctrl+u']],
  'undo': [['u']],
  'redo': [['ctrl+r']],
  'replay-command': [['.']],
  'record-macro': [['q']],
  'play-macro': [['@']],
  'unindent-row': [['<']],
  'indent-row': [['>']],
  'unindent-blocks': [['shift+tab'], ['ctrl+h']],
  'indent-blocks': [['tab'], ['ctrl+l']],
  'swap-block-down': [['ctrl+j']],
  'swap-block-up': [['ctrl+k']],
  'search-local': [['ctrl+/'], ['ctrl+f']],
  'search-global': [['/']],
  'zoom-prev-sibling': [['alt+k']],
  'zoom-next-sibling': [['alt+j']],
  'zoom-in': [[']'], ['alt+l'], ['ctrl+right']],
  'zoom-out': [['['], ['alt+h'], ['ctrl+left']],
  'zoom-cursor': [['enter'], ['ctrl+shift+right']],
  'zoom-root': [['shift+enter'], ['ctrl+shift+left']],
  'jump-prev': [['ctrl+o']],
  'jump-next': [['ctrl+i']],
  'swap-case': [['~']],
  'go-next-clone': [['g', 'c']],
}, NORMAL_MOTION_MAPPINGS);

export const VISUAL_MODE_MAPPINGS: HotkeyMapping = Object.assign({
  'move-cursor-visual': [[motionKey]],
  'toggle-help': [['?']],
  'exit-mode': [['esc'], ['ctrl+c'], ['ctrl+[']],
  'swap-visual-cursor': [['o'], ['O']],
  'visual-delete': [['d'], ['x']],
  'visual-change': [['c'], ['s']],
  'visual-yank': [['y']],
  'visual-swap-case': [['~']],
}, _.pick(NORMAL_MOTION_MAPPINGS, SINGLE_LINE_MOTIONS));

export const VISUAL_LINE_MODE_MAPPINGS: HotkeyMapping = Object.assign({
  'move-cursor-visual-line': [[motionKey]],
  'toggle-help': [['?']],
  'exit-mode': [['esc'], ['ctrl+c'], ['ctrl+[']],
  'swap-visual-cursor': [['o'], ['O']],
  'visual-line-delete': [['d'], ['x']],
  'visual-line-change': [['c'], ['s']],
  'visual-line-join': [['J']],
  'visual-line-yank': [['y']],
  'visual-line-yank-clone': [['Y']],
  'visual-line-indent': [['>'], ['tab'], ['ctrl+l']],
  'visual-line-unindent': [['<'], ['shift+tab'], ['ctrl+h']],
  'visual-line-swap-case': [['~']],
}, NORMAL_MOTION_MAPPINGS);

export const INSERT_MODE_MAPPINGS: HotkeyMapping = Object.assign({
  'move-cursor-insert': [[motionKey]],
  'toggle-help': [['ctrl+?']],
  'fold-toggle': [['ctrl+space']],
  'fold-open': [['meta+down']],
  'fold-close': [['meta+up']],
  'delete-blocks': [['meta+shift+delete']],
  'delete-char-after': [['delete']],
  'delete-to-line-beginning': [['ctrl+u']],
  'delete-to-line-end': [['ctrl+k']],
  'delete-to-word-beginning': [['ctrl+w'], ['ctrl+backspace']],
  // NOTE: paste-after doesn't make much sense for insert mode
  'paste-before': [['ctrl+v'], ['meta+v']],
  'yank-copy': [['meta+c']],
  'yank-delete': [['backspace']],
  'yank-cut': [['meta+x']],
  'split-line': [['enter']],
  'scroll-down': [['page down']],
  'scroll-up': [['page up']],
  'undo': [['ctrl+z'], ['meta+z']],
  'redo': [['ctrl+Z'], ['meta+Z']],
  'select-left': [['shift+left']],
  'select-right': [['shift+right']],
  'select-down': [['shift+down']],
  'select-up': [['shift+up']],
  'select-home': [['meta+shift+left']],
  'select-end': [['meta+shift+right']],
  'select-unindent': [['shift+tab']],
  'select-indent': [['tab']],
  'unindent-row': [],
  'indent-row': [],
  'swap-block-down': [],
  'swap-block-up': [],
  'zoom-prev-sibling': [['alt+k']],
  'zoom-next-sibling': [['alt+j']],
  'zoom-in': [['ctrl+right']],
  'zoom-out': [['ctrl+left']],
  'zoom-cursor': [['ctrl+shift+right']],
  'zoom-root': [['ctrl+shift+left']],
  'refresh': [['ctrl+r'], ['meta+r']],
  'save-cloud': [['ctrl+s'], ['meta+s']],
  'jump-prev': [['meta+left']],
  'jump-next': [['meta+right']],
}, INSERT_MOTION_MAPPINGS);

export const SEARCH_MODE_MAPPINGS: HotkeyMapping = Object.assign({
  // 'move-cursor-search': [[motionKey]],
  // 'toggle-help': [['ctrl+?']],
  'exit-mode': [['esc'], ['ctrl+c'], ['ctrl+[']],
  // 'search-delete-char-after': [['delete']],
  // 'search-delete-char-before': [['backspace'], ['shift+backspace']],
  // 'search-select': [['enter']],
  // 'search-up': [['ctrl+k'], ['up'], ['shift+tab']],
  // 'search-down': [['ctrl+j'], ['down'], ['tab']],
}, _.pick(INSERT_MOTION_MAPPINGS, SINGLE_LINE_MOTIONS));

export const NODE_OPERATION_MODE_MAPPINGS: HotkeyMapping = {
  'exit-and-undo': [['esc'], ['ctrl+c'], ['ctrl+[']],
  // 'unfold-node': [['o', 'a'], ['o', '1'], ['o', '2'], ['o', '3'], ['o', '0']],
  // 'open-markdown': [['i', 'm']],
  // 'open-html': [['i', 'r']],
  // 'open-drawio': [['i', 'd']],
  // 'open-mindmap': [['i', 'b']],
  // 'mark-mark': [['m', 'm']],
  // 'mark-tag': [['m', 't']],
};

export const WORKFLOWY_MODE_MAPPINGS: HotkeyMapping = Object.assign({
  'move-cursor-insert': [[motionKey]],
  'toggle-help': [['ctrl+?'], ['meta+?']],
  'fold-toggle': [],
  'fold-open': [['meta+down']],
  'fold-close': [['meta+up']],
  'delete-blocks': [['meta+shift+delete']],
  'delete-char-after': [['delete']],
  'delete-char-before': [['backspace'], ['shift+backspace']],
  'delete-to-line-beginning': [['ctrl+u']],
  'delete-to-line-end': [['ctrl+k']],
  'delete-to-word-beginning': [['ctrl+w'], ['ctrl+backspace']],
  // NOTE: paste-after doesn't make much sense for insert mode
  'paste-before': [['ctrl+y']],
  'split-line': [['enter']],
  'scroll-down': [['page down']],
  'scroll-up': [['page up']],
  'undo': [['ctrl+z'], ['meta+z']],
  'redo': [['ctrl+Z'], ['meta+Z'], ['meta+y']],
  'unindent-row': [],
  'indent-row': [],
  'unindent-blocks': [['shift+tab']],
  'indent-blocks': [['tab']],
  'swap-block-down': [['meta+shift+up']],
  'swap-block-up': [['meta+shift+down']],
  'zoom-prev-sibling': [],
  'zoom-next-sibling': [],
  'zoom-in': [],
  'zoom-out': [['meta+<']],
  'zoom-cursor': [['meta+>']],
  'zoom-root': [],
}, INSERT_MOTION_MAPPINGS);

function getDefaultData(): string {
  return JSON.stringify(default_data);
}

const config: Config = {
  defaultMode: 'INSERT',
  getDefaultData: getDefaultData,
  // TODO: get the keys from modes.ts
  defaultMappings:
    new KeyMappings({
       NORMAL : NORMAL_MODE_MAPPINGS,
       INSERT : INSERT_MODE_MAPPINGS,
       VISUAL : VISUAL_MODE_MAPPINGS,
       VISUAL_LINE : VISUAL_LINE_MODE_MAPPINGS,
       SEARCH : SEARCH_MODE_MAPPINGS,
       NODE_OPERATION : NODE_OPERATION_MODE_MAPPINGS,
    }),
};
export default config;

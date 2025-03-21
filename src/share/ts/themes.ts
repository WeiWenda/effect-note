import * as React from 'react';

import { ClientStore } from '../index';
import $ from 'jquery';

export type Theme = {
  'theme-bg-primary': string,
  'theme-bg-secondary': string,
  'theme-bg-tertiary': string,
  'theme-bg-callout': string,
  'theme-bg-highlight': string,

  'theme-text-primary': string,
  'theme-text-accent': string,
  'theme-text-link': string,

  'theme-trim': string,
  'theme-trim-accent': string,

  'theme-text-cursor': string,
  'theme-bg-cursor': string,
  'lineHeight': number,
  'fontSize': number,
  'fontFamily': string,
  'fontFamilyZh': string,
  'blockPaddingLeft': number,
};

export type StyleProperty =
  'theme-bg-primary' | 'theme-bg-secondary' | 'theme-bg-tertiary' | 'theme-bg-highlight' |
  'theme-text-primary' | 'theme-text-accent' | 'theme-trim' | 'theme-trim-accent' |
  'theme-link' | 'theme-cursor';

export function getStyles(clientStore: ClientStore, style_props: Array<StyleProperty>) {
  const style: React.CSSProperties = {};
  style_props.forEach((style_prop) => {
    if (style_prop === 'theme-bg-primary') {
      style.backgroundColor = clientStore.getClientSetting('theme-bg-primary');
    } else if (style_prop === 'theme-bg-secondary') {
      style.backgroundColor = clientStore.getClientSetting('theme-bg-secondary');
    } else if (style_prop === 'theme-bg-tertiary') {
      style.backgroundColor = clientStore.getClientSetting('theme-bg-tertiary');
    } else if (style_prop === 'theme-bg-highlight') {
      style.backgroundColor = clientStore.getClientSetting('theme-bg-highlight');
    } else if (style_prop === 'theme-text-primary') {
      style.color = clientStore.getClientSetting('theme-text-primary');
    } else if (style_prop === 'theme-text-accent') {
      style.color = clientStore.getClientSetting('theme-text-accent');
      style.fontWeight = 'bold';
    } else if (style_prop === 'theme-link') {
      style.color = clientStore.getClientSetting('theme-text-link');
      style.cursor = 'pointer';
      style.textDecoration = 'none';
    } else if (style_prop === 'theme-trim') {
      style.border = `1px solid ${clientStore.getClientSetting('theme-trim')}`;
    } else if (style_prop === 'theme-trim-accent') {
      style.border = `2px solid ${clientStore.getClientSetting('theme-trim-accent')}`;
    } else if (style_prop === 'theme-cursor') {
      style.backgroundColor = clientStore.getClientSetting('theme-bg-cursor');
      style.color = clientStore.getClientSetting('theme-text-cursor');
    }
  });
  return style;
}

const colors = {
  black: '#000000',
  white: '#ffffff',
  yellow: '#ffff00',
  solarized: {
    base03: '#002b36',
    base02: '#073642',
    base01: '#586e75',
    base00: '#657b83',
    base0: '#839496',
    base1: '#93a1a1',
    base2: '#eee8d5',
    base3: '#fdf6e3',
    yellow: '#b58900',
    orange: '#cb4b16',
    red: '#dc322f',
    magenta: '#d33682',
    violet: '#6c71c4',
    blue: '#268bd2',
    cyan: '#2aa198',
    green: '#859900',
  },
};

export const themes: {[key: string]: Theme} = {
  'Default': {
    'theme-bg-primary': colors.white,
    'theme-bg-secondary': '#F0F0F0',
    'theme-bg-tertiary': '#e0e0e0',
    'theme-bg-callout': '#e0e0e0',
    'theme-bg-highlight': '#ccc', // '#ffa' for yellowish

    'theme-text-primary': colors.black,
    'theme-text-accent': '#dd3388',
    'theme-text-link': '#8888ff',

    'theme-trim': colors.black,
    'theme-trim-accent': '#dd3388',

    'theme-text-cursor': colors.white,
    'theme-bg-cursor': '#666',
    fontSize: 15,
    lineHeight: 27,
    blockPaddingLeft: 36,
    fontFamily: 'Arial',
    fontFamilyZh: 'PingFang SC',
  },
  'Dark': {
    'theme-bg-primary': '#000000',
    'theme-bg-secondary': '#333333',
    'theme-bg-tertiary': '#404040',
    'theme-bg-callout': '#404040',
    'theme-bg-highlight': '#555', // '#770' for yellowish

    'theme-text-primary': '#eeeeee',
    'theme-text-accent': '#cccc00',
    'theme-text-link': '#8888ff',

    'theme-trim': '#eeeeee',
    'theme-trim-accent': '#cccc00',

    'theme-text-cursor': colors.black,
    'theme-bg-cursor': '#ccc',
    fontSize: 15,
    lineHeight: 27,
    blockPaddingLeft: 36,
    fontFamily: 'Arial',
    fontFamilyZh: 'PingFang SC',
  },
  'Solarized Light': {
    'theme-bg-primary': colors.solarized.base3,
    'theme-bg-secondary': colors.solarized.base2,
    'theme-bg-tertiary': '#e6dede',
    'theme-bg-callout': '#e6dede',
    'theme-bg-highlight': '#e2ebf3',

    'theme-text-primary': colors.solarized.base00,
    'theme-text-accent': colors.solarized.magenta,
    'theme-text-link': colors.solarized.blue,

    'theme-trim': colors.solarized.base01,
    'theme-trim-accent': colors.solarized.magenta,

    'theme-text-cursor': colors.solarized.base3,
    'theme-bg-cursor': colors.solarized.cyan,
    fontSize: 15,
    lineHeight: 27,
    blockPaddingLeft: 36,
    fontFamily: 'Arial',
    fontFamilyZh: 'PingFang SC',
  },
  'Solarized Dark': {
    'theme-bg-primary': colors.solarized.base02,
    'theme-bg-secondary': colors.solarized.base03,
    'theme-bg-tertiary': '#3C4446',
    'theme-bg-callout': '#3C4446',
    'theme-bg-highlight': '#384e55',

    'theme-text-primary': colors.solarized.base1,
    'theme-text-accent': colors.solarized.magenta,
    'theme-text-link': colors.solarized.violet,

    'theme-trim': colors.solarized.base1,
    'theme-trim-accent': colors.solarized.yellow,

    'theme-text-cursor': colors.solarized.base02,
    'theme-bg-cursor': colors.solarized.base1,
    fontSize: 15,
    lineHeight: 27,
    blockPaddingLeft: 36,
    fontFamily: 'Arial',
    fontFamilyZh: 'PingFang SC',
  },
};

export function appendStyleScript(clientStore: ClientStore) {
  const theme: Theme = {} as Theme;
  Object.keys(themes.Default).forEach((theme_property: string) => {
    // @ts-ignore
    theme[theme_property as keyof Theme] = clientStore.getClientSetting(theme_property as keyof Theme);
  });
  document.documentElement.setAttribute('data-theme',
    clientStore.getClientSetting('curTheme').includes('Dark') ? 'dark' : 'light');
  document.body.setAttribute('data-theme',
    clientStore.getClientSetting('curTheme').includes('Dark') ? 'dark' : 'light');
  $('.node-dynamic-style').remove();
  $('#app').append(`<style class='node-dynamic-style'>
                     button.dataloom-button{height: ${clientStore.getClientSetting('lineHeight')}px}
                    .session-content{padding-left: ${50 - clientStore.getClientSetting('blockPaddingLeft')}px}
                    .node .node-text{line-height: ${clientStore.getClientSetting('lineHeight')}px;min-height: ${clientStore.getClientSetting('lineHeight')}px}
                    .block{padding-left: ${clientStore.getClientSetting('blockPaddingLeft')}px}
                    .node{font-family: "${clientStore.getClientSetting('fontFamily')}","${clientStore.getClientSetting('fontFamilyZh')}",system-ui;font-size: ${clientStore.getClientSetting('fontSize')}px}
                    .rtf-toolbox{background-color: ${theme['theme-bg-primary']};color: ${theme['theme-text-primary']}}
                    </style>
                  `);
  $('.span-selection-background').remove();
  $('#app').append(`<style class='span-selection-background'>
                    .excalidraw .sidebar.excalidraw-node-content{background-color: ${theme['theme-bg-primary']};color: ${theme['theme-text-primary']}}
                    .horizontal-drag-board:hover{background-color: ${theme['theme-bg-secondary']}}
                    .ant-modal .ant-modal-content{background-color: ${theme['theme-bg-secondary']}}
                    .ant-modal .ant-modal-header{background-color: ${theme['theme-bg-secondary']}}
                    .ant-collapse-borderless > .ant-collapse-item{border-bottom: 2px solid ${theme['theme-bg-secondary']};}
                    .ant-menu:not(.ant-menu-horizontal) .ant-menu-item-selected {background-color:${theme['theme-bg-secondary']}}
                    .bullet-folded {background-color:${theme['theme-bg-tertiary']}}
                    .bullet-fa-circle:hover {background-color: ${theme['theme-bg-highlight']}}
                    .ant-collapse-item-active > .ant-collapse-header {background-color: ${theme['theme-bg-secondary']}}
                    .node-html table th{background-color: ${theme['theme-bg-secondary']}}
                    .node-html code{background-color: ${theme['theme-bg-tertiary']}}
                    .node-html blockquote{border-left-color: ${theme['theme-bg-cursor']};background-color: ${theme['theme-bg-secondary']}}
                    .node-html table tr:hover{background-color: ${theme['theme-bg-secondary']}}
                    .ant-tabs-card >.ant-tabs-nav .ant-tabs-tab-active{background-color: ${theme['theme-bg-primary']}}
                    .ant-tabs-card.ant-tabs-top >.ant-tabs-nav .ant-tabs-tab-active{border-bottom-color: ${theme['theme-bg-primary']}}
                    .ant-tabs-card >.ant-tabs-nav .ant-tabs-tab{border: 1px solid ${theme['theme-bg-tertiary']};}
                    .ant-list-split .ant-list-header{border-block-end: 1px solid ${theme['theme-bg-secondary']};}
                    .ant-list-split .ant-list-item{border-block-end: 1px solid ${theme['theme-bg-secondary']};}
                    .ant-list-split.ant-list-something-after-last-item .ant-spin-container>.ant-list-items>.ant-list-item:last-child{border-block-end: 1px solid ${theme['theme-bg-secondary']};}
                    span::selection{background:${theme['theme-bg-highlight']}}</style>`);
  $('.span-hover-color').remove();
  $('#app').append(`<style class='span-hover-color'>
                    .vditor-reset{color: ${theme['theme-text-primary']}}
                    .vditor-reset a{color: ${theme['theme-text-link']}}
                    .vditor-reset blockquote{color: ${theme['theme-text-primary']};border-left-color: ${theme['theme-bg-cursor']};background-color: ${theme['theme-bg-secondary']}}
                    .ant-pagination .ant-pagination-item-active{border-color: ${theme['theme-text-link']}}
                    .ant-pagination .ant-pagination-item-active:hover a{color: ${theme['theme-text-link']}}
                    .ant-pagination .ant-pagination-item-active:hover{border-color: ${theme['theme-text-link']}}
                    .ant-tabs .ant-tabs-tab:hover{color: ${theme['theme-text-link']}}
                    .ant-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn{color: ${theme['theme-text-link']}}
                    .ant-modal .ant-modal-close{color: ${theme['theme-text-primary']}}
                    .ant-modal .ant-modal-title{color: ${theme['theme-text-primary']}}
                    .ant-tag.ant-tag-default{color: ${theme['theme-text-primary']}}
                    .ant-select:not(.ant-select-disabled):not(.ant-select-customize-input):not(.ant-pagination-size-changer):hover .ant-select-selector{border-color:${theme['theme-text-link']}}
                    .ant-input:hover{border-color:${theme['theme-text-link']}}
                    .ant-radio-wrapper{color: ${theme['theme-text-primary']}}
                    .ant-btn-default:not(:disabled):not(.ant-btn-disabled):hover{border-color:${theme['theme-text-link']};color:${theme['theme-text-link']}}
                    .ant-btn-primary:not(:disabled):not(.ant-btn-disabled):hover{color:${theme['theme-text-link']}}
                    .file-toolbar .ant-btn{color: ${theme['theme-text-primary']}}
                    .node-html a{color: ${theme['theme-text-link']}}
                    .ant-input-group .ant-input-group-addon{color: ${theme['theme-text-primary']}}
                    .ant-input-affix-wrapper:not(.ant-input-affix-wrapper-disabled):hover{border-color:${theme['theme-text-link']}}
                    .ant-input-affix-wrapper-focused{border-color:${theme['theme-text-link']}}
                    .ant-input-search .ant-input:hover{border-color:${theme['theme-text-link']}}
                    .ant-input-search .ant-input-search-button:hover{color:${theme['theme-text-link']};border-color:${theme['theme-text-link']}}
                    .ant-input-search .ant-input:focus{border-color:${theme['theme-text-link']}}
                    .ant-menu-horizontal:not(.ant-menu-dark) > .ant-menu-item:hover::after{border-bottom: 2px solid ${theme['theme-text-link']};}
                    .ant-menu-horizontal:not(.ant-menu-dark) > .ant-menu-item-selected::after{border-bottom: 2px solid ${theme['theme-text-link']};}
                    .ant-menu-submenu:hover > .ant-menu-submenu-title > .ant-menu-submenu-arrow{color:${theme['theme-text-link']}}
                    .ant-menu-inline span:hover{color:${theme['theme-text-link']}}</style>`);
}

export const defaultTheme = themes.Default;

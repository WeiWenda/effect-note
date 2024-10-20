import { LoomMenu } from 'src/components/obsidian-dataloom/shared/menu-provider/types';
import { findMenuTriggerEl } from 'src/components/obsidian-dataloom/shared/menu-provider/utils';

/**
 * Gets the top menu element.
 * If the top menu is null, then we return the app element.
 * @param appId - The id of the app instance
 */
export const getFocusLayerEl = (
  topMenu: LoomMenu | null,
  appId: string
): HTMLElement => {
  if (topMenu) {
    const topMenuEl = document.getElementById(topMenu.id);
    if (!topMenuEl) throw Error('No top menu element found');
    return topMenuEl;
  }

  const appEl = document.getElementById(appId);
  if (!appEl) throw Error('No app element found');
  return appEl;
};

export const getFocusableEls = (layerEl: HTMLElement) => {
  const focusableEls = layerEl.querySelectorAll('.dataloom-focusable');
  const arr = Array.from(focusableEls);

  if (isMenuEl(layerEl)) {
    const menuId = layerEl.id;
    const menuTrigger = findMenuTriggerEl(menuId);

    //Some menu's don't have a menu trigger
    if (menuTrigger) {
      return [menuTrigger, ...arr];
    }
  }
  return arr;
};

export const focusNextElement = (
  layerEl: HTMLElement,
  focusableEls: Element[]
) => {
  const focusedEl = document.activeElement;

  //If there's an element that's focused, get the next element
  if (focusedEl) {
    const currentIndex = Array.from(focusableEls).indexOf(focusedEl);
    if (currentIndex !== -1) {
      let index = currentIndex + 1;
      if (index > focusableEls.length - 1) index = 0;
      (focusableEls[index] as HTMLElement).focus();
      return;
    }
  }

  //Otherwise focus the first element or the selected element
  const selectedEl = layerEl.querySelector('.dataloom-selected');
  if (selectedEl) {
    (selectedEl as HTMLElement).focus();
  } else {
    (focusableEls[0] as HTMLElement).focus();
  }
};

export const getNumOptionBarFocusableEls = (appEl: HTMLElement) => {
  const el = appEl.querySelector(
    '.dataloom-option-bar'
  ) as HTMLElement | null;
  if (!el) throw Error('No option bar found');
  return getFocusableEls(el).length;
};

export const getNumBottomBarFocusableEl = (appEl: HTMLElement) => {
  const el = appEl.querySelector(
    '.dataloom-bottom-bar'
  ) as HTMLElement | null;
  if (!el) throw Error('No bottom bar found');
  return getFocusableEls(el).length;
};

export const isArrowKeyPressed = (
  e: React.KeyboardEvent,
  isMenuOpen: boolean
) => {
  if (isMenuOpen) {
    return e.key === 'ArrowDown' || e.key === 'ArrowUp';
  }
  return (
    e.key === 'ArrowDown' ||
    e.key === 'ArrowUp' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight'
  );
};

const isMenuEl = (el: HTMLElement) => {
  return el.classList.contains('dataloom-menu');
};

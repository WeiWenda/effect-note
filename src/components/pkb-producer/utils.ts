import {unstable_batchedUpdates} from 'react-dom';
import {MIME_TYPES, newElementWith} from '@excalidraw/excalidraw';
import {isBoundToContainer, isLinearElement} from './typeChecks';
import type {ExcalidrawElement} from '@excalidraw/excalidraw/types/element/types';

type FILE_EXTENSION = Exclude<keyof typeof MIME_TYPES, 'binary'>;

const INPUT_CHANGE_INTERVAL_MS = 500;

export type ResolvablePromise<T> = Promise<T> & {
  resolve: [T] extends [undefined] ? (value?: T) => void : (value: T) => void;
  reject: (error: Error) => void;
};
export const resolvablePromise = <T>() => {
  let resolve!: any;
  let reject!: any;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  (promise as any).resolve = resolve;
  (promise as any).reject = reject;
  return promise as ResolvablePromise<T>;
};

export const distance2d = (x1: number, y1: number, x2: number, y2: number) => {
  const xd = x2 - x1;
  const yd = y2 - y1;
  return Math.hypot(xd, yd);
};

export const filterWithPredicate = (elements: readonly ExcalidrawElement[], predicate: (e: ExcalidrawElement) => boolean): ExcalidrawElement[] => {
  const elementIdsToKeep = new Set();
  elements.forEach(e => {
    if (predicate(e)) {
      elementIdsToKeep.add(e.id);
    }
  });
  elements.forEach(el => {
    if (isLinearElement(el)) {
      if (elementIdsToKeep.has(el.startBinding?.elementId) && elementIdsToKeep.has(el.endBinding?.elementId)) {
        elementIdsToKeep.add(el.id);
      }
    }
  });
  return elements.map(el => {
    if (elementIdsToKeep.has(el.id)) {
      return el;
    }
    if (isBoundToContainer(el) && elementIdsToKeep.has(el.containerId)) {
      return el;
    }
    return newElementWith(el, { isDeleted: true });
  });
};

export const getTextElementsMatchingQuery = (
  elements: ExcalidrawElement[],
  query: string[],
  exactMatch: boolean = false, // https://github.com/zsviczian/obsidian-excalidraw-plugin/issues/530
): ExcalidrawElement[] => {
  if (!elements || elements.length === 0 || !query || query.length === 0) {
    return [];
  }

  return elements.filter((el: any) =>
    el.type === 'text' &&
    query.some((q) => {
      if (exactMatch) {
        const text = el.originalText.toLowerCase().split('\n')[0].trim();
        const m = text.match(/^#*(# .*)/);
        if (!m || m.length !== 2) {
          return false;
        }
        return m[1] === q.toLowerCase();
      }
      const text = el.originalText.toLowerCase().replaceAll('\n', ' ').trim();
      // to distinguish between '# frame' and '# frame 1' https://github.com/zsviczian/obsidian-excalidraw-plugin/issues/530
      return text.match(q.toLowerCase());
    }));
};

export const debounce = <T extends any[]>(
  fn: (...args: T) => void,
  timeout: number,
) => {
  let handle = 0;
  let lastArgs: T | null = null;
  const ret = (...args: T) => {
    lastArgs = args;
    clearTimeout(handle);
    handle = window.setTimeout(() => {
      lastArgs = null;
      fn(...args);
    }, timeout);
  };
  ret.flush = () => {
    clearTimeout(handle);
    if (lastArgs) {
      const _lastArgs = lastArgs;
      lastArgs = null;
      fn(..._lastArgs);
    }
  };
  ret.cancel = () => {
    lastArgs = null;
    clearTimeout(handle);
  };
  return ret;
};

export const withBatchedUpdates = <
  TFunction extends ((event: any) => void) | (() => void),
>(
  func: Parameters<TFunction>['length'] extends 0 | 1 ? TFunction : never,
) =>
  ((event) => {
    unstable_batchedUpdates(func as TFunction, event);
  }) as TFunction;

/**
 * barches React state updates and throttles the calls to a single call per
 * animation frame
 */
export const withBatchedUpdatesThrottled = <
  TFunction extends ((event: any) => void) | (() => void),
>(
  func: Parameters<TFunction>['length'] extends 0 | 1 ? TFunction : never,
) => {
  // @ts-ignore
  return throttleRAF<Parameters<TFunction>>(((event) => {
    unstable_batchedUpdates(func, event);
  }) as TFunction);
};

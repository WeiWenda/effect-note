import { unstable_batchedUpdates } from 'react-dom';
import { MIME_TYPES } from '@excalidraw/excalidraw';

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

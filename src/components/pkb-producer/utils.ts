import {unstable_batchedUpdates} from 'react-dom';
import {MIME_TYPES, newElementWith} from '@weiwenda/excalidraw';
import {isArrowElement, isBoundToContainer, isLinearElement, isTextBindableContainer} from './typeChecks';
import * as dagre from '@dagrejs/dagre';
import type {
  ExcalidrawArrowElement,
  ExcalidrawElement,
  ExcalidrawTextElementWithContainer,
  NonDeletedExcalidrawElement
} from '@weiwenda/excalidraw/dist/excalidraw/element/types';
import {NormalizedZoomValue, UIAppState} from '@weiwenda/excalidraw/dist/excalidraw/types';

type FILE_EXTENSION = Exclude<keyof typeof MIME_TYPES, 'binary'>;

const INPUT_CHANGE_INTERVAL_MS = 500;

export const showSelectedShapeActionsFinal = (
  appState: UIAppState,
) =>
  Boolean(
    !appState.viewModeEnabled &&
    ((appState.activeTool.type !== 'custom' &&
        (appState.activeTool.type !== 'selection' &&
          appState.activeTool.type !== 'eraser' &&
          appState.activeTool.type !== 'hand' &&
          appState.activeTool.type !== 'laser')) ||
      Object.keys(appState.selectedElementIds).length),
  );

export const getNormalizedZoom = (zoom: number): NormalizedZoomValue => {
  return Math.max(0.1, Math.min(zoom, 30)) as NormalizedZoomValue;
};

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

export function constructGraph(elements: readonly ExcalidrawElement[], revert: boolean = false, ranker: string = 'network-simplex') {
  const g = new dagre.graphlib.Graph();
  g.setGraph({rankdir: 'LR', align: 'UL', ranker: ranker});
  g.setDefaultEdgeLabel(function() { return {}; });
  const nodes = elements.filter(e => isTextBindableContainer(e) && !isArrowElement(e));
  const edges = elements.filter(e => isArrowElement(e)).map(e => e as ExcalidrawArrowElement);
  nodes.forEach(node => {
    g.setNode(node.id, {width: node.width, height: node.height});
  });
  edges.forEach(edge => {
    if (edge.startBinding && edge.endBinding) {
      if (revert) {
        g.setEdge(edge.endBinding.elementId, edge.startBinding.elementId);
      } else {
        g.setEdge(edge.startBinding.elementId, edge.endBinding.elementId);
      }
    }
  });
  return g;
}

export const selectWithSelectElementId = (
  direction: string,
  elements: readonly ExcalidrawElement[],
  selectedElementId: string,
) => {
  const elementIdsToKeep = new Set();
  const graph = constructGraph(elements);
  if (direction.includes('down')) {
    dagre.graphlib.alg.postorder(graph, selectedElementId).forEach(nodeId => {
      elementIdsToKeep.add(nodeId);
    });
  }
  if (direction.includes('up')) {
    const revertGraph = constructGraph(elements, true);
    dagre.graphlib.alg.postorder(revertGraph, selectedElementId).forEach(nodeId => {
      elementIdsToKeep.add(nodeId);
    });
  }
  elements.forEach(el => {
    if (isLinearElement(el)) {
      if (elementIdsToKeep.has(el.startBinding?.elementId) && elementIdsToKeep.has(el.endBinding?.elementId)) {
        elementIdsToKeep.add(el.id);
      }
    }
  });
  return Object.fromEntries(
    Array.from(elementIdsToKeep.values()).map((e) => [e, true]),
  ) as { [id: string]: true; };
};

export const filterWithSelectElementId = (
  direction: string,
  elements: readonly ExcalidrawElement[],
  selectedElementId: string,
) => {
  const elementIdsToKeep = new Set();
  const graph = constructGraph(elements);
  if (direction.includes('down')) {
    dagre.graphlib.alg.postorder(graph, selectedElementId).forEach(nodeId => {
      elementIdsToKeep.add(nodeId);
    });
  }
  if (direction.includes('up')) {
    const revertGraph = constructGraph(elements, true);
    dagre.graphlib.alg.postorder(revertGraph, selectedElementId).forEach(nodeId => {
      elementIdsToKeep.add(nodeId);
    });
  }
  elements.forEach(el => {
    if (isLinearElement(el)) {
      if (elementIdsToKeep.has(el.startBinding?.elementId) && elementIdsToKeep.has(el.endBinding?.elementId)) {
        elementIdsToKeep.add(el.id);
      }
    }
  });
  return elements.map((el) => {
    if (elementIdsToKeep.has(el.id)) {
      return el;
    }
    if (isBoundToContainer(el) && elementIdsToKeep.has(el.containerId)) {
      return el;
    }
    return newElementWith(el, { isDeleted: true });
  });
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
  exactMatch: boolean = false, // https://github.com/excalidraw/obsidian-excalidraw-plugin/issues/530
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
      // to distinguish between '# frame' and '# frame 1' https://github.com/excalidraw/obsidian-excalidraw-plugin/issues/530
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

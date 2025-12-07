import {isLinearElement, newElementWith} from '@excalidraw/excalidraw';
import * as dagre from '@dagrejs/dagre';
import type {
  ExcalidrawArrowElement,
  ExcalidrawBindableElement,
  ExcalidrawElement,
  ExcalidrawTextContainer,
  ExcalidrawTextElement,
  ExcalidrawTextElementWithContainer
} from
      '@excalidraw/excalidraw/dist/types/excalidraw/element/types';
import { MarkNonNullable } from '@excalidraw/excalidraw/dist/types/excalidraw/utility-types';
import {NormalizedZoomValue, UIAppState} from '@excalidraw/excalidraw/dist/types/excalidraw/types';
import {useCallback, useState} from 'react';

export const useCallbackRefState = <T>() => {
  const [refValue, setRefValue] = useState<T | null>(null);
  const refCallback = useCallback((value: T | null) => setRefValue(value), []);
  return [refValue, refCallback] as const;
};

export const isBindableElement = (
  element: ExcalidrawElement | null,
  includeLocked = true,
): element is ExcalidrawBindableElement => {
  return (
    element != null &&
    (!element.locked || includeLocked === true) &&
    (element.type === 'rectangle' ||
      element.type === 'diamond' ||
      element.type === 'ellipse' ||
      element.type === 'image' ||
      element.type === 'iframe' ||
      element.type === 'embeddable' ||
      element.type === 'frame' ||
      element.type === 'magicframe' ||
      (element.type === 'text' && !element.containerId))
  );
};

export const isTextBindableContainer = (
  element: ExcalidrawElement | null,
  includeLocked = true,
): element is ExcalidrawTextContainer => {
  return (
    element != null &&
    (!element.locked || includeLocked === true) &&
    (element.type === 'rectangle' ||
      element.type === 'diamond' ||
      element.type === 'ellipse' ||
      isArrowElement(element))
  );
};

export const isArrowElement = (
  element?: ExcalidrawElement | null,
): element is ExcalidrawArrowElement => {
  return element != null && element.type === 'arrow';
};

export const hasBoundTextElement = (
  element: ExcalidrawElement | null,
): element is MarkNonNullable<ExcalidrawBindableElement, 'boundElements'> => {
  return (
    isTextBindableContainer(element) &&
    !!element.boundElements?.some(({ type }) => type === 'text')
  );
};

export const isBoundToContainer = (
  element: ExcalidrawElement | null,
): element is ExcalidrawTextElementWithContainer => {
  return (
    element !== null &&
    'containerId' in element &&
    element.containerId !== null &&
    isTextElement(element)
  );
};
export const isTextElement = (
  element: ExcalidrawElement | null,
): element is ExcalidrawTextElement => {
  return element != null && element.type === 'text';
};

export const getBoundTextOrDefault = (
  element: ExcalidrawElement,
  elements: readonly ExcalidrawElement[] | undefined,
  defaultText: string
) => {
  if (hasBoundTextElement(element)) {
    const boundText = element.boundElements!.find(({ type }) => type === 'text');
    return elements ? (elements.find(e => e.id === boundText?.id) as ExcalidrawTextElement).text : defaultText;
  } else {
    return defaultText;
  }
};

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

export const filterWithPredicate = (elements: readonly ExcalidrawElement[],
                                    predicate: (e: ExcalidrawElement) => boolean): ExcalidrawElement[] => {
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

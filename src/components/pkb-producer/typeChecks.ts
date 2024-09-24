import type {
  ExcalidrawArrowElement,
  ExcalidrawBindableElement,
  ExcalidrawElement,
  ExcalidrawEmbeddableElement,
  ExcalidrawFrameElement,
  ExcalidrawImageElement,
  ExcalidrawLinearElement,
  ExcalidrawTextContainer,
  ExcalidrawTextElement,
  ExcalidrawTextElementWithContainer,
  InitializedExcalidrawImageElement,
} from '@weiwenda/excalidraw/dist/excalidraw/element/types';
import {ToolType} from '@weiwenda/excalidraw/dist/excalidraw/types';
import {MarkNonNullable} from '@weiwenda/excalidraw/dist/excalidraw/utility-types';

export const assertNever = (
  value: never,
  message: string | null,
  softAssert?: boolean,
): never => {
  if (!message) {
    return value;
  }
  if (softAssert) {
    console.error(message);
    return value;
  }

  throw new Error(message);
};

export type ExcalidrawElementType = ExcalidrawElement['type'];

export type ElementOrToolType = ExcalidrawElementType | ToolType | 'custom';

export const isInitializedImageElement = (
  element: ExcalidrawElement | null,
): element is InitializedExcalidrawImageElement => {
  return !!element && element.type === 'image' && !!element.fileId;
};

export const isImageElement = (
  element: ExcalidrawElement | null,
): element is ExcalidrawImageElement => {
  return !!element && element.type === 'image';
};

export const isEmbeddableElement = (
  element: ExcalidrawElement | null | undefined,
): element is ExcalidrawEmbeddableElement => {
  return !!element && element.type === 'embeddable';
};

export const isTextElement = (
  element: ExcalidrawElement | null,
): element is ExcalidrawTextElement => {
  return element != null && element.type === 'text';
};

export const isFrameElement = (
  element: ExcalidrawElement | null,
): element is ExcalidrawFrameElement => {
  return element != null && element.type === 'frame';
};

export const isLinearElement = (
  element?: ExcalidrawElement | null,
): element is ExcalidrawLinearElement => {
  return element != null && isLinearElementType(element.type);
};

export const isArrowElement = (
  element?: ExcalidrawElement | null,
): element is ExcalidrawArrowElement => {
  return element != null && element.type === 'arrow';
};

export const isLinearElementType = (
  elementType: ElementOrToolType,
): boolean => {
  return (
    elementType === 'arrow' || elementType === 'line' // || elementType === 'freedraw'
  );
};

export const isBindingElement = (
  element?: ExcalidrawElement | null,
  includeLocked = true,
): element is ExcalidrawLinearElement => {
  return (
    element != null &&
    (!element.locked || includeLocked === true) &&
    isBindingElementType(element.type)
  );
};

export const isBindingElementType = (
  elementType: ElementOrToolType,
): boolean => {
  return elementType === 'arrow';
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
      element.type === 'embeddable' ||
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

export const hasBoundTextElement = (
  element: ExcalidrawElement | null,
): element is MarkNonNullable<ExcalidrawBindableElement, 'boundElements'> => {
  return (
    isTextBindableContainer(element) &&
    !!element.boundElements?.some(({ type }) => type === 'text')
  );
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

export const isUsingAdaptiveRadius = (type: string) =>
  type === 'rectangle' ||
  type === 'embeddable' ||
  type === 'image';

export const isUsingProportionalRadius = (type: string) =>
  type === 'line' || type === 'arrow' || type === 'diamond';

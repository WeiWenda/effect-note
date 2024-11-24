import ELK from 'elkjs/lib/elk.bundled.js';
import {
  ElementsMap,
  ExcalidrawArrowElement,
  ExcalidrawBindableElement,
  ExcalidrawElement
} from '@weiwenda/excalidraw/dist/excalidraw/element/types';
import {bumpVersion, getCommonBoundingBox, getMaximumGroups, intersectElementWithLine, newElementWith} from '@weiwenda/excalidraw';
import {ElkNode, LayoutOptions} from 'elkjs/lib/elk-api';
import {GlobalPoint, LocalPoint} from '@weiwenda/excalidraw/dist/math';
import _ from 'lodash';
const elk = new ELK();

/**
 * Transforms array of objects containing `id` attribute,
 * or array of ids (strings), into a Map, keyd by `id`.
 */
export const arrayToMap = <T extends { id: string } | string>(
  items: readonly T[] | Map<string, T>,
) => {
  if (items instanceof Map) {
    return items;
  }
  return items.reduce((acc: Map<string, T>, element) => {
    acc.set(typeof element === 'string' ? element : element.id, element);
    return acc;
  }, new Map());
};

export const doAutoLayout = async (selectedAlgorithm: string,
                             nodePlacementStrategy: string,
                             selectedDirection: string,
                             elementsBefore: readonly ExcalidrawElement[],
                             selectedElementIds: { [p: string]: true }): Promise<ExcalidrawElement[]> => {
  let groupMap = new Map();
  let targetElkMap = new Map();
  let arrowEls = [];
  let elementsAll = _.cloneDeep(elementsBefore) as ExcalidrawElement[];
  const elementsEditable = Object.values(selectedElementIds).includes(true) ? elementsAll.filter(e => selectedElementIds[e.id]) : elementsAll;
  const componentComponentSpacing = '10';
  const nodeNodeSpacing = '40';
  const nodeNodeBetweenLayersSpacing = '100';
  let layoutOptionsJson: LayoutOptions = {
    'elk.algorithm': selectedAlgorithm,
    'org.eclipse.elk.layered.nodePlacement.strategy': nodePlacementStrategy,
    'org.eclipse.elk.direction': selectedDirection,
    'org.eclipse.elk.spacing.componentComponent': componentComponentSpacing,
    'org.eclipse.elk.spacing.nodeNode': nodeNodeSpacing,
    'org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers': nodeNodeBetweenLayersSpacing,
    'org.eclipse.elk.disco.componentCompaction.componentLayoutAlgorithm': 'org.eclipse.elk.layered',
    'org.eclipse.elk.layered.crossingMinimization.semiInteractive': 'true',
    'org.eclipse.elk.layered.considerModelOrder.components': 'FORCE_MODEL_ORDER'
  };
  const groups = getMaximumGroups(elementsEditable, arrayToMap(elementsEditable))
    .filter((els) => els.length > 0);

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: layoutOptionsJson,
    children: [],
    edges: [],
  };

  for (let i = 0; i < groups.length; i++) {
    const elements = groups[i];
    if (
      elements.length === 1 &&
      (elements[0].type === 'arrow' || elements[0].type === 'line')
    ) {
      if (
        elements[0].type === 'arrow' &&
        (elements[0] as ExcalidrawArrowElement).startBinding &&
        (elements[0] as ExcalidrawArrowElement).endBinding
      ) {
        arrowEls.push(elements[0]);
      }
    } else {
      let elkId = 'g' + i;
      // 编组的子元素在重新布局时当做一个元素
      elements.reduce((result, el) => {
        result.set(el.id, elkId);
        return result;
      }, targetElkMap);

      const box = getBoundingBox(elements);
      groupMap.set(elkId, {
        elements: elements,
        boundingBox: box,
      });

      graph.children!.push({
        id: elkId,
        width: box.width,
        height: box.height,
        x: box.topX,
        y: box.topY,
      });
    }
  }

  for (let i = 0; i < arrowEls.length; i++) {
    const arrowEl = arrowEls[i];
    const startElkId = targetElkMap.get(arrowEl.startBinding!.elementId);
    const endElkId = targetElkMap.get(arrowEl.endBinding!.elementId);

    graph.edges!.push({
      id: 'e' + i,
      sources: [startElkId],
      targets: [endElkId],
    });
  }

  const initTopX =
    Math.min(...Array.from(groupMap.values()).map((v) => v.boundingBox.topX)) -
    12;
  const initTopY =
    Math.min(...Array.from(groupMap.values()).map((v) => v.boundingBox.topY)) -
    12;

  const elementsAfterLayout = await elk
    .layout(graph)
    .then((resultGraph) => {
      for (const elkEl of resultGraph.children!) {
        const group = groupMap.get(elkEl.id);
        for (const groupEl of group.elements) {
          const originalDistancX = groupEl.x - group.boundingBox.topX;
          const originalDistancY = groupEl.y - group.boundingBox.topY;
          const groupElDistanceX =
            elkEl.x! + initTopX + originalDistancX - groupEl.x;
          const groupElDistanceY =
            elkEl.y! + initTopY + originalDistancY - groupEl.y;

          groupEl.x = groupEl.x + groupElDistanceX;
          groupEl.y = groupEl.y + groupElDistanceY;
          bumpVersion(groupEl);
        }
      }
      normalizeSelectedArrows(elementsEditable);
      return elementsEditable;
    });
  if (Object.values(selectedElementIds).includes(true)) {
    const afterLayoutMap: ElementsMap = arrayToMap(elementsAfterLayout);
    return elementsAll.map(e => {
      if (selectedElementIds[e.id]) {
        return afterLayoutMap.get(e.id);
      } else {
        return e;
      }
    }) as ExcalidrawElement[];
  } else {
    return elementsAfterLayout;
  }
};

const getBoundingBox = (elements: ExcalidrawElement[]): {
  topX: number;
  topY: number;
  width: number;
  height: number;
} => {
  const bb = getCommonBoundingBox(elements);
  return {
    topX: bb.minX,
    topY: bb.minY,
    width: bb.maxX - bb.minX,
    height: bb.maxY - bb.minY,
  };
};
/*
 * Normalize Selected Arrows
 */

function normalizeSelectedArrows(elementsBefore: ExcalidrawElement[]) {
  let gapValue = 2;

  const selectedIndividualArrows = getMaximumGroups(elementsBefore, arrayToMap(elementsBefore))
    .reduce((result, g) => [...result, ...g.filter(el => el.type === 'arrow')], [])
    .map(e => e as ExcalidrawArrowElement);

  // const allElements = ea.getViewElements();
  const allElements = elementsBefore;
  for (const arrow of selectedIndividualArrows) {
    const startBindingEl = allElements.filter(
      (el) => el.id === (arrow.startBinding || {}).elementId
    )[0] as ExcalidrawBindableElement;
    const endBindingEl = allElements.filter(
      (el) => el.id === (arrow.endBinding || {}).elementId
    )[0] as ExcalidrawBindableElement;

    if (startBindingEl) {
      recalculateStartPointOfLine(
        arrow as ExcalidrawArrowElement,
        startBindingEl,
        endBindingEl,
        gapValue
      );
    }
    if (endBindingEl) {
      recalculateEndPointOfLine(arrow as ExcalidrawArrowElement, endBindingEl, startBindingEl, gapValue);
    }
  }

  // ea.copyViewElementsToEAforEditing(selectedIndividualArrows);
  // ea.addElementsToView(false, false);
}

function recalculateStartPointOfLine(
  line: ExcalidrawArrowElement, el: ExcalidrawBindableElement, elB: ExcalidrawBindableElement, gapValue: number) {
  const aX = el.x + el.width / 2;
  const bX =
    line.points.length <= 2 && elB
      ? elB.x + elB.width / 2
      : line.x + line.points[1][0];
  const aY = el.y + el.height / 2;
  const bY =
    line.points.length <= 2 && elB
      ? elB.y + elB.height / 2
      : line.y + line.points[1][1];

  line.startBinding!.gap = gapValue;
  line.startBinding!.focus = 0;
  const intersectA = intersectElementWithLine(
    el,
    [bX, bY] as GlobalPoint,
    [aX, aY] as GlobalPoint,
    line.startBinding!.gap,
    arrayToMap([el])
  );

  if (intersectA && intersectA.length > 0) {
    const points = line.points as any[];
    points[0] = [0, 0] as LocalPoint;
    for (let i = 1; i < line.points.length; i++) {
      points[i][0] -= intersectA[0][0] - line.x;
      points[i][1] -= intersectA[0][1] - line.y;
    }
    (line as any).x = intersectA[0][0];
    (line as any).y = intersectA[0][1];
  }
}

function recalculateEndPointOfLine(line: ExcalidrawArrowElement, el: ExcalidrawBindableElement, elB: ExcalidrawElement, gapValue: number) {
  const aX: number = el.x + el.width / 2;
  const bX: number =
    line.points.length <= 2 && elB
      ? elB.x + elB.width / 2
      : line.x + line.points[line.points.length - 2][0];
  const aY: number = el.y + el.height / 2;
  const bY: number =
    line.points.length <= 2 && elB
      ? elB.y + elB.height / 2
      : line.y + line.points[line.points.length - 2][1];

  line.endBinding!.gap = gapValue;
  line.endBinding!.focus = 0;
  const intersectA = intersectElementWithLine(
    el,
    [bX, bY] as GlobalPoint,
    [aX, aY] as GlobalPoint,
    line.endBinding!.gap,
    arrayToMap([el])
  );

  if (intersectA && intersectA.length > 0) {
    const points = line.points as any[];
    points[points.length - 1] = [
      intersectA[0][0] - line.x,
      intersectA[0][1] - line.y,
    ] as LocalPoint;
  }
}

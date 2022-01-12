import { toJS } from 'mobx';
import { point, lineString, polygon } from '@turf/helpers';
import cloneDeep from 'lodash/cloneDeep';
import type { Position } from 'geojson';

import { FeatureModel } from '../../state/FeatureModel';
import {
  EditableGeometryType,
  FeatureLifecycleStage,
} from '../../type/geometry';

/**
 * Make a point with the desired eventual geometry type.
 * @param type The type of geometry the feature will become
 */
function makePoint(type: EditableGeometryType) {
  return new FeatureModel({
    stage: FeatureLifecycleStage.EditShape,
    geojson: point([-1, -2]),
    finalType: type,
  });
}

/**
 * Make a two-vertex line string with the desired eventual geometry type.
 * @param type The type of geometry the feature will become
 */
function makeEdge(type: EditableGeometryType & ('LineString' | 'Polygon')) {
  return new FeatureModel({
    stage: FeatureLifecycleStage.EditShape,
    geojson: lineString([
      [-1, -2],
      [1, 2],
    ]),
    finalType: type,
  });
}

/**
 * Make a three-vertex line string or polygon.
 * @param type The type of geometry
 */
function makeTriplet(type: EditableGeometryType & ('LineString' | 'Polygon')) {
  switch (type) {
    case 'LineString':
      return new FeatureModel({
        stage: FeatureLifecycleStage.EditShape,
        geojson: lineString([
          [-1, -2],
          [1, 2],
          [3, 4],
        ]),
        finalType: type,
      });
    case 'Polygon':
      return new FeatureModel({
        stage: FeatureLifecycleStage.EditShape,
        geojson: polygon([
          [
            [-1, -2],
            [1, 2],
            [3, 4],
            [-1, -2],
          ],
        ]),
        finalType: type,
      });
  }
}

/**
 * Test that no vertices can be added to a point
 */
test.each([[undefined], [-1], [0], [1]] as Array<[number | undefined]>)(
  'addVertex on a point',
  (index) => {
    const p = makePoint('Point');
    expect(() => {
      p.addVertex([0, 0], index);
    }).toThrow('Point');
  }
);

/**
 * Test that vertices can be added to any position to a point to make a line string
 */
test.each([
  [-2, 'LineString'],
  [-1, 'LineString'],
  [0, 'LineString'],
  [1, 'LineString'],
  [2, 'LineString'],
  [undefined, 'LineString'],
  [-2, 'Polygon'],
  [-1, 'Polygon'],
  [0, 'Polygon'],
  [1, 'Polygon'],
  [2, 'Polygon'],
  [undefined, 'Polygon'],
] as Array<[number | undefined, EditableGeometryType]>)(
  'addVertex on a feature with one vertex',
  (index, type) => {
    const p = makePoint(type);
    p.addVertex([0, 0], index);
    let expected = [
      [-1, -2],
      [0, 0],
    ];
    if (index === 0 || index === -2) {
      expected.reverse();
    }
    expect(p.geojson.geometry.coordinates).toStrictEqual(expected);
    expect(p.geojson.geometry.type).toStrictEqual('LineString');
  }
);

/**
 * Test that vertices can be added to any position to an edge to make a longer line string
 * or a polygon
 */
test.each([
  [-4, 'LineString'],
  [-3, 'LineString'],
  [-2, 'LineString'],
  [-1, 'LineString'],
  [0, 'LineString'],
  [1, 'LineString'],
  [2, 'LineString'],
  [3, 'LineString'],
  [4, 'LineString'],
  [undefined, 'LineString'],
  [-4, 'Polygon'],
  [-3, 'Polygon'],
  [-2, 'Polygon'],
  [-1, 'Polygon'],
  [0, 'Polygon'],
  [1, 'Polygon'],
  [2, 'Polygon'],
  [3, 'Polygon'],
  [4, 'Polygon'],
  [undefined, 'Polygon'],
] as Array<[number | undefined, EditableGeometryType & ('LineString' | 'Polygon')]>)(
  'addVertex on a feature with two vertices',
  (index, type) => {
    const e = makeEdge(type);
    e.addVertex([0, 0], index);
    let expected: Array<Position> | Array<Array<Position>> = [
      [-1, -2],
      [1, 2],
      [0, 0],
    ];
    if (typeof index === 'number') {
      if (index <= -3 || index === 0) {
        expected = [
          [0, 0],
          [-1, -2],
          [1, 2],
        ];
      } else if (index === -2 || index === 1) {
        expected = [
          [-1, -2],
          [0, 0],
          [1, 2],
        ];
      }
    }
    if (type === 'Polygon') {
      expected.push(expected[0]);
      expected = [expected];
    }
    expect(e.geojson.geometry.coordinates).toStrictEqual(expected);
    expect(e.geojson.geometry.type).toStrictEqual(type);
  }
);

/**
 * Test that vertices can be added to any position to a three-vertex shape
 * to make a larger line string or polygon
 */
test.each([
  [-5, 'LineString'],
  [-4, 'LineString'],
  [-3, 'LineString'],
  [-2, 'LineString'],
  [-1, 'LineString'],
  [0, 'LineString'],
  [1, 'LineString'],
  [2, 'LineString'],
  [3, 'LineString'],
  [4, 'LineString'],
  [5, 'LineString'],
  [undefined, 'LineString'],
  [-5, 'Polygon'],
  [-4, 'Polygon'],
  [-3, 'Polygon'],
  [-2, 'Polygon'],
  [-1, 'Polygon'],
  [0, 'Polygon'],
  [1, 'Polygon'],
  [2, 'Polygon'],
  [3, 'Polygon'],
  [4, 'Polygon'],
  [5, 'Polygon'],
  [undefined, 'Polygon'],
] as Array<[number | undefined, EditableGeometryType & ('LineString' | 'Polygon')]>)(
  'addVertex on a feature with three vertices',
  (index, type) => {
    const t = makeTriplet(type);
    t.addVertex([0, 0], index);
    let expected: Array<Position> | Array<Array<Position>> = [
      [-1, -2],
      [1, 2],
      [3, 4],
      [0, 0],
    ];
    if (typeof index === 'number') {
      if (index <= -4 || index === 0) {
        expected = [
          [0, 0],
          [-1, -2],
          [1, 2],
          [3, 4],
        ];
      } else if (index === -3 || index === 1) {
        expected = [
          [-1, -2],
          [0, 0],
          [1, 2],
          [3, 4],
        ];
      } else if (index === -2 || index === 2) {
        expected = [
          [-1, -2],
          [1, 2],
          [0, 0],
          [3, 4],
        ];
      }
    }
    if (type === 'Polygon') {
      expected.push(expected[0]);
      expected = [expected];
    }
    expect(t.geojson.geometry.coordinates).toStrictEqual(expected);
    expect(t.geojson.geometry.type).toStrictEqual(type);
  }
);

/**
 * Test that each vertex in a three-vertex line string or polygon (without holes)
 * can be dragged to a new position
 */
test.each([
  [0, 'LineString'],
  [1, 'LineString'],
  [2, 'LineString'],
  [0, 'Polygon'],
  [1, 'Polygon'],
  [2, 'Polygon'],
] as Array<[number, EditableGeometryType & ('LineString' | 'Polygon')]>)(
  'addVertex on a feature with three vertices',
  (index, type) => {
    const t = makeTriplet(type);
    const newPosition = [0, 0];
    t.dragPosition(newPosition, index);
    let expected: Array<Position> | Array<Array<Position>> = [
      [-1, -2],
      [1, 2],
      [3, 4],
    ];
    expected.splice(index, 1, newPosition);
    if (type === 'Polygon') {
      expected.push(expected[0]);
      expected = [expected];
    }
    expect(t.geojson.geometry.coordinates).toStrictEqual(expected);
    expect(t.geojson.geometry.type).toStrictEqual(type);
  }
);

/**
 * Test that no vertices can be removed from a point
 */
test.each([[undefined], [-1], [0], [1]] as Array<[number | undefined]>)(
  'removeVertex on a point',
  (index) => {
    const p = makePoint('Point');
    const expected = toJS(p);
    p.removeVertex(index);
    expect(toJS(p)).toStrictEqual(expected);
  }
);

/**
 * Test that no vertices can be removed from a minimal line string
 */
test.each([[undefined], [-2], [-1], [0], [1], [2]] as Array<
  [number | undefined]
>)('removeVertex on a one-segment line string', (index) => {
  const p = makeEdge('LineString');
  const expected = toJS(p);
  p.removeVertex(index);
  expect(toJS(p)).toStrictEqual(expected);
});

/**
 * Test that no vertices can be removed from a minimal polygon
 */
test.each([
  [undefined],
  [-5],
  [-4],
  [-3],
  [-2],
  [-1],
  [0],
  [1],
  [2],
  [3],
  [4],
  [5],
] as Array<[number | undefined]>)('removeVertex on a triangle', (index) => {
  const p = makeTriplet('Polygon');
  const expected = toJS(p);
  p.removeVertex(index);
  expect(toJS(p)).toStrictEqual(expected);
});

/**
 * Test that no vertices can be removed from an incomplete line string
 */
test.each([[undefined], [-2], [-1], [0], [1], [2]] as Array<
  [number | undefined]
>)('removeVertex on an incomplete line string', (index) => {
  const p = makePoint('LineString');
  const expected = toJS(p);
  p.removeVertex(index);
  expect(toJS(p)).toStrictEqual(expected);
});

/**
 * Test that no vertices can be removed from an incomplete polygon
 */
test.each([
  [undefined],
  [-5],
  [-4],
  [-3],
  [-2],
  [-1],
  [0],
  [1],
  [2],
  [3],
  [4],
  [5],
] as Array<[number | undefined]>)(
  'removeVertex on an incomplete polygon',
  (index) => {
    const e = makeEdge('Polygon');
    const expectedEdge = toJS(e);
    e.removeVertex(index);
    expect(toJS(e)).toStrictEqual(expectedEdge);
    const p = makePoint('Polygon');
    const expectedPoint = toJS(p);
    p.removeVertex(index);
    expect(toJS(p)).toStrictEqual(expectedPoint);
  }
);

/**
 * Remove any vertex from a three-vertex line string
 */
test.each([
  [undefined],
  [-5],
  [-4],
  [-3],
  [-2],
  [-1],
  [0],
  [1],
  [2],
  [3],
  [4],
  [5],
] as Array<[number | undefined]>)(
  'removeVertex on a line string with three vertices',
  (index = -1) => {
    const type = 'LineString';
    const p = makeTriplet(type);
    const expected: Array<Position> | Array<Array<Position>> = [
      [-1, -2],
      [1, 2],
      [3, 4],
    ];
    expected.splice(index, 1);
    p.removeVertex(index);
    expect(p.geojson.geometry.coordinates).toStrictEqual(expected);
    expect(p.geojson.geometry.type).toStrictEqual(type);
  }
);

/**
 * Remove any vertex from a four-vertex polygon
 */
test.each([
  [undefined],
  [-6],
  [-5],
  [-4],
  [-3],
  [-2],
  [-1],
  [0],
  [1],
  [2],
  [3],
  [4],
  [5],
  [6],
] as Array<[number | undefined]>)(
  'removeVertex on a polygon with four vertices',
  (index) => {
    let expected = [
      [-1, -2],
      [1, 2],
      [3, 4],
      [5, 6],
      [-1, -2],
    ];
    const p = new FeatureModel({
      stage: FeatureLifecycleStage.EditShape,
      geojson: polygon([cloneDeep(expected)]),
      finalType: 'Polygon',
    });
    switch (index) {
      case -6:
      case -5:
      case -4:
      case 0:
        expected = [
          [1, 2],
          [3, 4],
          [5, 6],
          [1, 2],
        ];
        break;
      case -3:
      case 1:
        expected = [
          [-1, -2],
          [3, 4],
          [5, 6],
          [-1, -2],
        ];
        break;
      case -2:
      case 2:
        expected = [
          [-1, -2],
          [1, 2],
          [5, 6],
          [-1, -2],
        ];
        break;
      case -1:
      case 3:
      case 4:
      case 5:
      case 6:
      default:
        expected = [
          [-1, -2],
          [1, 2],
          [3, 4],
          [-1, -2],
        ];
        break;
    }
    p.removeVertex(index);
    expect(p.geojson.geometry.coordinates).toStrictEqual([expected]);
  }
);

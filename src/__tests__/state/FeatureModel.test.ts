import { point, lineString, polygon } from '@turf/helpers';
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
function makeEdge(type: (EditableGeometryType & 'LineString') | 'Polygon') {
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
function makeTriplet(type: (EditableGeometryType & 'LineString') | 'Polygon') {
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
test('addVertex on a point', () => {
  const p = makePoint('Point');
  expect(() => {
    p.addVertex([0, 0]);
  }).toThrow('Point');
  expect(() => {
    p.addVertex([0, 0], -1);
  }).toThrow('Point');
  expect(() => {
    p.addVertex([0, 0], 0);
  }).toThrow('Point');
  expect(() => {
    p.addVertex([0, 0], 1);
  }).toThrow('Point');
});

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
] as Array<[number | undefined, (EditableGeometryType & 'LineString') | 'Polygon']>)(
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
 * Test that vertices can be added to any position to a three-vertex shape a longer line string
 * or a polygon
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
] as Array<[number | undefined, (EditableGeometryType & 'LineString') | 'Polygon']>)(
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

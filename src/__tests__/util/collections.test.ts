import {
  Comparison,
  globalToLocalIndices,
  groupSort,
} from '../../util/collections';
import { listsToSets } from '../test_helpers/collections';

/**
 * Test that no indices can be resolved in an empty collection.
 * In this case, the collection does not contain any sub-collections.
 */
test('globalToLocalIndices on empty collection', () => {
  expect(() => {
    globalToLocalIndices(0, () => null);
  }).toThrow('range');
});

/**
 * Test that no indices can be resolved in an empty collection.
 * In this case, the collection is made up of zero-length collections.
 */
test('globalToLocalIndices on collection of empty collections', () => {
  expect(() => {
    globalToLocalIndices(0, (i) => {
      /**
       * Simulate 10 empty sub-collections
       */
      if (i < 10) {
        return 0;
      } else {
        return null;
      }
    });
  }).toThrow('range');
});

/**
 * Complex set of tests that resolve different indices in a collection
 * containing empty sub-collections and sub-collections of different lengths.
 */
test.each([
  [0, 0, 1],
  [1, 1, 1],
  [2, 0, 3],
  [3, 1, 3],
  [5, 3, 3],
  [6, 0, 5],
])(
  'globalToLocalIndices on collection with unequal length subcollections',
  (index, innerIndex, outerIndex) => {
    expect(
      globalToLocalIndices(index, (i) => {
        if (i < 10) {
          if (i % 2 === 0) {
            // Empty sub-collection
            return 0;
          } else {
            // Non-empty sub-collection
            return i + 1;
          }
        } else {
          return null;
        }
      })
    ).toStrictEqual({ innerIndex, outerIndex });
  }
);

/**
 * Test group sorting of an empty collection
 */
test('groupSort on empty collection', () => {
  expect(groupSort([], () => undefined)).toStrictEqual([]);
});

/**
 * Test group sorting of entirely equal or incomparable elements
 */
test.each([
  [[0, 1, 2, 3], () => Comparison.Equal],
  [[0, 1, 2, 3], () => undefined],
])(
  'groupSort on collection of equal or incomparable elements',
  (elements, compare) => {
    const expected = listsToSets([elements]);
    const actual = listsToSets(groupSort(elements, compare));
    expect(actual).toStrictEqual(expected);
  }
);

/**
 * Test group sorting of a single element
 */
test.each([
  [[1], () => Comparison.Equal],
  [[1], () => Comparison.Less],
  [[1], () => Comparison.Greater],
  [[1], () => undefined],
])('groupSort on a single element', (elements, compare) => {
  expect(groupSort(elements, compare)).toStrictEqual([[1]]);
});

/**
 * An ordering function that follows the same semantics as numerical comparisons
 *
 * @param a The first number to compare
 * @param b The second number to compare
 */
function compareNumbers(a: number, b: number): Comparison | undefined {
  if (a < b) {
    return Comparison.Less;
  } else if (a === b) {
    return Comparison.Equal;
  } else if (a > b) {
    return Comparison.Greater;
  } else {
    return undefined;
  }
}

/**
 * Test group sorting of two elements in arbitrary orders
 */
test.each([
  [
    [1, 2],
    [[1], [2]],
  ],
  [[1, 1], [[1, 1]]],
  [
    [2, 1],
    [[1], [2]],
  ],
  [[NaN, NaN], [[NaN, NaN]]],
])('groupSort on collections of two elements', (elements, expected) => {
  expect(groupSort(elements, compareNumbers)).toStrictEqual(expected);
});

/**
 * Test group sorting of objects
 */
test('groupSort on objects', () => {
  expect(
    groupSort(
      [{ a: 1 }, { a: 3 }, { a: 1 }, { a: 2 }],
      (a: { a: number }, b: { a: number }) => compareNumbers(a.a, b.a)
    )
  ).toStrictEqual([[{ a: 1 }, { a: 1 }], [{ a: 2 }], [{ a: 3 }]]);
});

/**
 * Test an attempt to use a comparison function that generates a cycle
 */
test('groupSort cycle detection', () => {
  expect(() => {
    groupSort(
      [{ a: 1 }, { a: 3 }, { a: 4 }, { a: 2 }],
      (a: { a: number }, b: { a: number }) => {
        if (a.a === 1 && b.a === 4) {
          return Comparison.Greater;
        } else if (a.a === 4 && b.a === 1) {
          return Comparison.Less;
        } else {
          return compareNumbers(a.a, b.a);
        }
      }
    );
  }).toThrow('cycle');
});

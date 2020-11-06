import { globalToLocalIndices } from '../../util/collections';

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

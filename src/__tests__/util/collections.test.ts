import { globalToLocalIndices } from '../../util/collections';

test('globalToLocalIndices on empty collection', () => {
  expect(() => {
    globalToLocalIndices(0, () => null);
  }).toThrow('range');
});

test('globalToLocalIndices on collection of empty collections', () => {
  expect(() => {
    globalToLocalIndices(0, (i) => {
      if (i < 10) {
        return 0;
      } else {
        return null;
      }
    });
  }).toThrow('range');
});

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
            return 0;
          } else {
            return i + 1;
          }
        } else {
          return null;
        }
      })
    ).toStrictEqual({ innerIndex, outerIndex });
  }
);

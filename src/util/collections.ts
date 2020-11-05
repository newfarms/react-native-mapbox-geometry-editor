export function globalToLocalIndices(
  index: number,
  getLength: (i: number) => number | null
) {
  let found = false;
  let cumulativeIndex = 0;
  let outerIndex = -1;

  let currentLength: number | null = 0;

  if (!Number.isInteger(index)) {
    throw new Error(`index ${index} is not an integer.`);
  }
  if (index < 0) {
    throw new Error(
      `A negative value for index (${index}) is not yet supported.`
    );
  }

  while (!found) {
    outerIndex += 1;
    currentLength = getLength(outerIndex);
    if (typeof currentLength === 'number') {
      if (cumulativeIndex + currentLength > index) {
        found = true;
      } else {
        cumulativeIndex += currentLength;
      }
    } else {
      break;
    }
  }
  if (!found) {
    throw new Error(
      `index ${index} is outside the range of possible indices, [0, ${
        cumulativeIndex - 1
      }].`
    );
  }

  return {
    innerIndex: index - cumulativeIndex,
    outerIndex,
  };
}

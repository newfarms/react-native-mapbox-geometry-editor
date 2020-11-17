/**
 * Given a list of sub-collections that form a single collection,
 * find the index of the sub-collection ("outer" index) and the index
 * within that sub-collection ("inner" index) corresponding
 * to a "global" index into the concatenated list of elements
 * from all sub-collections.
 *
 * Throws an error if the "global" index is out of range.
 *
 * This function does not actually operate on collections, but the above
 * description explains the purpose for which it is normally used.
 * In order not to impose any structure on the collections, this function
 * requires as input a function that returns the length of a sub-collection
 * corresponding to a given "outer" index. Strictly speaking, this function
 * solves an abstract mathematical problem: Find the largest index in a list
 * of numbers such that the partial sum of the numbers preceding that index
 * does not exceed the query number, and return both this index and
 * the result of subtracting the partial sum from the query number.
 *
 * @param index The index of the element in a hypothetical list formed
 *              by concatenating all sub-collections
 * @param getLength A function that returns the length of each sub-collection,
 *                  given its index in the top-level collection. `getLength`
 *                  will be passed a non-negative integer, and is expected
 *                  to return `null` when the integer is equal to the
 *                  number of sub-collections.
 */
export function globalToLocalIndices(
  index: number,
  getLength: (i: number) => number | null
) {
  if (!Number.isInteger(index)) {
    throw new Error(`index ${index} is not an integer.`);
  }
  if (index < 0) {
    throw new Error(
      `A negative value for index (${index}) is not yet supported.`
    );
  }

  // Is there a sub-collection that contains the element?
  let found = false;
  // The sum of the lengths of all preceding sub-collections
  let cumulativeIndex = 0;
  // The index of the sub-collection containing the element
  let outerIndex = -1;

  // The length of the current sub-collection being iterated over
  let currentLength: number | null = 0;

  /**
   * Iterate over sub-collections
   */
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
      // Reached the end of the collection of sub-collections
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
    /**
     * The index of the element in the corresponding sub-collection
     */
    innerIndex: index - cumulativeIndex,
    /**
     * The index of the sub-collection containing the element
     */
    outerIndex,
  };
}

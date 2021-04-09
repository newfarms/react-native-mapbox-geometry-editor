import partition from 'lodash/partition';

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

/**
 * Binary comparison operator return values
 */
export enum Comparison {
  /**
   * Start at `1` so that all enum members are truthy.
   */
  Less = 1,
  Equal,
  Greater,
}

/**
 * A binary comparison operator
 */
export interface Comparator<T> {
  /**
   * @param a The first item to compare
   * @param b The second item to compare
   * @return How `a` is related to `b`, or `undefined`, if the two are incomparable.
   */
  (a: T, b: T): Comparison | undefined;
}

/**
 * A helper type for groupSort describing a node in a directed graph
 */
interface GroupSortNode<T> {
  /**
   * The data contained in the node
   */
  reference: T;
  /**
   * The number of incoming edges
   */
  inDegree: number;
  /**
   * The nodes directly connected to this node by outgoing edges
   */
  descendants: Array<GroupSortNode<T>>;
}

/**
 * A predicate that tests if a node has an in-degree of zero
 * @param node The graph node
 * @returns Whether the node has an in-degree of zero
 */
function isInDegreeZero<T>(node: GroupSortNode<T>) {
  return node.inDegree === 0;
}

/**
 * Uses a comparator to group a list of elements into a list of lists.
 * Each list in the output list contains elements that are all neither
 * greater than nor less than each other. At least one element in a given
 * list is less than at least one element in the next list in the output list.
 *
 * Elements are not tested for comparison with themselves.
 *
 * @param elements The elements to group and sort
 * @param compare The comparator to use for ordering elements
 * @return A list of groups
 */
export function groupSort<T>(
  elements: Array<T>,
  compare: Comparator<T>
): Array<Array<T>> {
  let graph = elements.map(
    (value): GroupSortNode<T> => ({
      reference: value,
      inDegree: 0,
      descendants: [],
    })
  );

  // Build a partial order using pairwise comparisons
  for (let i = 0; i < graph.length; i += 1) {
    for (let j = i + 1; j < graph.length; j += 1) {
      switch (compare(graph[i].reference, graph[j].reference)) {
        case Comparison.Less:
          graph[i].descendants.push(graph[j]);
          graph[j].inDegree += 1;
          break;
        case Comparison.Greater:
          graph[j].descendants.push(graph[i]);
          graph[i].inDegree += 1;
          break;
        default:
          break;
      }
    }
  }

  // Repeatedly remove nodes with in-degrees of zero from the graph, in groups
  let groups: Array<Array<T>> = [];
  while (graph.length > 0) {
    const partitionedGraph = partition(graph, isInDegreeZero);
    /**
     * The first element contains all nodes with in-degrees of zero.
     * A directed acyclic graph should always have such nodes.
     */
    if (partitionedGraph[0].length === 0) {
      throw new Error('The comparator has produced a graph with a cycle.');
    }
    partitionedGraph[0].forEach((node) => {
      node.descendants.forEach((descendant) => {
        descendant.inDegree -= 1;
      });
    });
    groups.push(partitionedGraph[0].map((node) => node.reference));
    /**
     * The second element contains all nodes that had non-zero in-degrees.
     * These nodes become the remaining graph.
     * At the end of this iteration, some of these nodes now have zero in-degrees
     * because of the removal of all nodes with zero in-degrees from the graph.
     */
    graph = partitionedGraph[1];
  }

  return groups;
}

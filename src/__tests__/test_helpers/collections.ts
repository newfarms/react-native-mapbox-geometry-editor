/**
 * Helper function that converts a list of lists into a list of sets,
 * allowing such structures to be compared while ignoring the order of the elements
 * in the inner lists.
 */
export function listsToSets(lists: Array<Array<unknown>>) {
  return lists.map((list) => new Set(list));
}

export function filterUniqueAndSort<T extends string>(arr: T[]): T[] {
  return [...new Set(arr)].sort((a, b) => a.localeCompare(b, 'ja'));
}
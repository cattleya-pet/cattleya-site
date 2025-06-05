import type { Breed } from './types';

// 重複する犬種/猫種を除去してソート
export function filterUniqueBreeds(breeds: Breed[]): Breed[] {
  return breeds
    .reduce((acc, current) => {
      const exists = acc.find(item => item.name === current.name);
      if (!exists && current.name) {
        acc.push(current);
      }
      return acc;
    }, [] as Breed[])
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}
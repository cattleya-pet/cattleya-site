import type { Breed, SubmenuItem } from './types';
import { client } from '../client';

// 特定の動物種類に属するペット一覧を取得
async function getPetsByAnimalType(animalType: string) {
  try {
    const response = await client.getList({
      endpoint: 'individual',
      queries: {
        filters: `animalType[equals]${animalType}`,
        limit: 100,
      },
    });
    return response.contents;
  } catch (error) {
    console.error(`Error fetching pets for ${animalType}:`, error);
    return [];
  }
}

export async function getMixBreedsByAnimalType(submenuItems: SubmenuItem[] = []): Promise<Array<{ type: string; breeds: Breed[] }>> {
  return Promise.all(
    submenuItems.map(async (item) => {
      if (item.hasMix) {
        const pets = await getPetsByAnimalType(item.type);
        const mixBreeds = pets
          .filter(pet => pet.classification === 'mix')
          .map(pet => ({
            name: pet.breedTypeJa,
            url: `/animals/${item.type}/mix/${encodeURIComponent(pet.breedTypeJa)}`
          }));
        return { type: item.type, breeds: mixBreeds };
      }
      return { type: item.type, breeds: [] };
    })
  );
}
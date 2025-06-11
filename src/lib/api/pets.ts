import { client } from './client';
import type { Pet, MicroCMSResponse } from '../types';
import { filterUniqueAndSort } from '../utils/array';

// 最新のペット情報を取得
export async function getLatestPets(limit: number = 9) {
  try {
    const response = await client.getList<Pet>({
      endpoint: 'individual',
      queries: {
        limit,
        orders: '-petNumber', // 誕生日順から、ペットナンバー順に変更
      },
    });
    return response.contents;
  } catch (error) {
    console.error('Error fetching latest pets:', error);
    return [];
  }
}

// 動物の種類一覧を取得
export async function getAnimalTypes(): Promise<string[]> {
  try {
    const response = await client.getList<Pet>({
      endpoint: 'individual',
      queries: { limit: 100 },
    });
    return filterUniqueAndSort(response.contents.map(pet => pet.animalType));
  } catch (error) {
    console.error('Error fetching animal types:', error);
    return [];
  }
}

// 特定の動物種類に属するペット一覧を取得
export async function getPetsByAnimalType(animalType: string): Promise<Pet[]> {
  try {
    const response = await client.getList<Pet>({
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

// 動物種類ごとの犬種/猫種情報を取得
export async function getBreedsByAnimalType(animalType: string) {
  try {
    const pets = await getPetsByAnimalType(animalType);
    
    // 血統書付きの犬種/猫種を抽出
    const pureBreeds = pets
      .filter(pet => pet.classification === 'bloodline')
      .map(pet => ({
        name: pet.breedTypeJa,
        url: `/search/${animalType}/${encodeURIComponent(pet.breedTypeEn.toLowerCase())}`
      }));

    // ミックスの存在確認
    const hasMix = pets.some(pet => pet.classification === 'mix');

    // 重複を除去してソート
    const uniquePureBreeds = pureBreeds.reduce((acc, current) => {
      const exists = acc.find(item => item.name === current.name);
      if (!exists && current.name) {
        acc.push(current);
      }
      return acc;
    }, [] as { name: string; url: string }[])
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    return { pureBreeds: uniquePureBreeds, hasMix };
  } catch (error) {
    console.error(`Error getting breeds for animal type ${animalType}:`, error);
    return { pureBreeds: [], hasMix: false };
  }
}
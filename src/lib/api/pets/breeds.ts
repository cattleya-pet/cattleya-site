import type { Pet, Breed } from './types';
import { filterUniqueBreeds } from './utils';
import { getPetsByAnimalType } from './queries';
import { client } from '../client';

// 動物の種類一覧を取得
export async function getAnimalTypes(): Promise<string[]> {
  try {
    const response = await client.getList<Pet>({
      endpoint: 'individual',
      queries: { 
        limit: 100,
        fields: 'animalType'
      },
    });
    // 犬を先に表示するためのカスタムソート
    return [...new Set(response.contents.map(pet => pet.animalType))]
      .sort((a, b) => {
        if (a === 'dog' && b === 'cat') return -1;
        if (a === 'cat' && b === 'dog') return 1;
        return a.localeCompare(b, 'ja');
      });
  } catch (error) {
    console.error('Error fetching animal types:', error);
    return [];
  }
}

// 動物種類ごとの犬種/猫種情報を取得
export async function getBreedsByAnimalType(animalType: string) {
  try {
    console.log(`[breeds.ts] ${animalType}の犬種/猫種情報を取得中...`);
    const pets = await getPetsByAnimalType(animalType);
    console.log(`[breeds.ts] ${animalType}のペット数:`, pets.length);

    // 血統書付きの犬種/猫種を抽出
    const pureBreeds = pets
      .filter(pet => pet.classification === 'bloodline')
      .map(pet => {
        console.log(`[breeds.ts] Pet sample - Ja: ${pet.breedTypeJa}, En: ${pet.breedTypeEn}`);
        return {
          name: pet.breedTypeJa,
          url: `/search/${animalType}s/${encodeURIComponent(pet.breedTypeEn)}`
        };
      });
    console.log(`[breeds.ts] ${animalType}の純血種数:`, pureBreeds.length);
    console.log(`[breeds.ts] ${animalType}の純血種サンプルURL:`, pureBreeds[0]?.url);

    // ミックスペットを抽出して確認する
    const mixPets = pets.filter(pet => pet.classification === 'mix');
    console.log(`[breeds.ts] ${animalType}のミックスペット数:`, mixPets.length);
    if (mixPets.length > 0) {
      console.log(`[breeds.ts] ${animalType}のミックスペットサンプル:`, mixPets[0]);
    }

    // ミックスの存在確認と抽出
    const hasMix = mixPets.length > 0;

    // ミックス品種を抽出
    const mixBreedsData = mixPets.map(pet => ({
      name: pet.breedTypeJa,
      url: `/search/${animalType}s/mix/${encodeURIComponent(pet.breedTypeEn)}`
    }));
    console.log(`[breeds.ts] ${animalType}のミックス品種データ:`, mixBreedsData);

    // 重複を除去してソート
    const uniquePureBreeds = filterUniqueBreeds(pureBreeds);
    const uniqueMixBreeds = filterUniqueBreeds(mixBreedsData);
    console.log(`[breeds.ts] ${animalType}の重複除去後のミックス品種数:`, uniqueMixBreeds.length);

    // ダミーデータを追加（テスト用）
    const dummyMixBreeds = animalType === 'dog'
      ? [
          { name: 'チワワミックス（テスト）', url: `/search/${animalType}s/mix/chihuahua-mix` },
          { name: 'プードルミックス（テスト）', url: `/search/${animalType}s/mix/poodle-mix` }
        ]
      : [
          { name: 'アメリカンショートヘアーミックス（テスト）', url: `/search/${animalType}s/mix/american-shorthair-mix` }
        ];

    // 実データがある場合はそれを使用し、なければダミーデータを使用
    const finalMixBreeds = uniqueMixBreeds.length > 0 ? uniqueMixBreeds : dummyMixBreeds;
    console.log(`[breeds.ts] ${animalType}の最終ミックス品種データ:`, finalMixBreeds);

    return {
      pureBreeds: uniquePureBreeds,
      hasMix: hasMix || dummyMixBreeds.length > 0,
      mixBreeds: finalMixBreeds
    };
  } catch (error) {
    console.error(`Error getting breeds for animal type ${animalType}:`, error);
    return { pureBreeds: [], hasMix: false, mixBreeds: [] };
  }
}
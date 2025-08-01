import { client } from '../client';
import { API_ENDPOINTS, API_QUERY_PARAMS } from '../../constants';
import { randomSort30Minutes } from '../../utils/randomSort';
import type { Pet } from './types';

export async function getLatestPetsByType(animalType: string, limit?: number): Promise<Pet[]> {
  try {
    const queries: any = {
      filters: `animalType[equals]${animalType}`,
      // randomIdによるソートを削除（フロントエンドでランダムソート）
      fields: [
        'id',
        'animalType',
        'breedTypeJa',
        'color',
        'gender',
        'birthday',
        'storeName',
        'storeId',
        'isNew',
        'imageUrl01',
        'tags',
        'fatherWeight',
        'motherWeight',
        'mixFatherBreed',
        'mixMotherBreed',
        'classification',
        'breedTypeEn',
        'parentBreed',
        'petDescription',
        'imageUrl02',
        'imageUrl03',
        'videoUrl'
      ].join(',')
    };
    
    if (limit) {
      queries.limit = limit;
    } else {
      queries.limit = API_QUERY_PARAMS.LIMIT;
    }

    const response = await client.getList<Pet>({
      endpoint: API_ENDPOINTS.PETS,
      queries
    });
    
    // フロントエンドでランダムソート（30分ごとに同じ順序）
    const sortedPets = randomSort30Minutes(response.contents);
    
    return limit ? sortedPets.slice(0, limit) : sortedPets;
  } catch (error) {
    console.error(`Error fetching ${animalType} pets:`, error);
    return [];
  }
}

// breeds.tsで使用される関数を追加
export async function getPetsByAnimalType(animalType: string): Promise<Pet[]> {
  try {
    const queries: any = {
      filters: `animalType[equals]${animalType}`,
      fields: [
        'id',
        'animalType',
        'breedTypeJa',
        'breedTypeEn',
        'classification',
        'mixFatherBreed',
        'mixMotherBreed'
      ].join(','),
      limit: 1000 // 全データを取得
    };

    const response = await client.getList<Pet>({
      endpoint: API_ENDPOINTS.PETS,
      queries
    });
    return response.contents;
  } catch (error) {
    console.error(`Error fetching pets by animal type ${animalType}:`, error);
    return [];
  }
}

export async function getAllLatestPets(limit?: number): Promise<Pet[]> {
  try {
    // limitが指定されている場合は、統合後にlimitを適用するため多めに取得
    const fetchLimit = limit ? Math.ceil(limit * 1.5) : undefined;
    
    const [dogs, cats] = await Promise.all([
      getLatestPetsByType('dog', fetchLimit),
      getLatestPetsByType('cat', fetchLimit)
    ]);

    // 犬と猫を統合し、フロントエンドでランダムソート（30分ごとに同じ順序）
    const allPets = [...dogs, ...cats];
    const sortedPets = randomSort30Minutes(allPets);

    // limitが指定されている場合は、ソート後にlimitを適用
    return limit ? sortedPets.slice(0, limit) : sortedPets;
  } catch (error) {
    console.error('Error fetching all pets:', error);
    return [];
  }
}


// オフセット指定でペットを取得する関数
export async function getPetsWithOffset(offset: number, limit: number = 18): Promise<Pet[]> {
  try {
    const queries: any = {
      // randomIdによるソートを削除（フロントエンドでランダムソート）
      fields: [
        'id',
        'animalType',
        'breedTypeJa',
        'color',
        'gender',
        'birthday',
        'storeName',
        'storeId',
        'isNew',
        'imageUrl01',
        'tags',
        'fatherWeight',
        'motherWeight',
        'mixFatherBreed',
        'mixMotherBreed',
        'classification',
        'breedTypeEn',
        'parentBreed',
        'petDescription',
        'imageUrl02',
        'imageUrl03',
        'videoUrl'
      ].join(','),
      limit: limit + offset // オフセット分も含めて取得
    };

    const response = await client.getList<Pet>({
      endpoint: API_ENDPOINTS.PETS,
      queries
    });
    
    // フロントエンドでランダムソート（30分ごとに同じ順序）
    const sortedPets = randomSort30Minutes(response.contents);
    
    // オフセットとlimitを適用
    return sortedPets.slice(offset, offset + limit);
  } catch (error) {
    console.error('Error fetching pets with offset:', error);
    return [];
  }
}
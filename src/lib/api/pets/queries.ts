import { client } from '../client';
import { API_ENDPOINTS, API_QUERY_PARAMS } from '../../constants';
import type { Pet } from './types';

export async function getLatestPetsByType(animalType: string, limit?: number): Promise<Pet[]> {
  try {
    const queries: any = {
      filters: `animalType[equals]${animalType}`,
      orders: '-randomId', // ランダムID降順
      fields: [
        'id',
        'randomId',
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
    return response.contents;
  } catch (error) {
    console.error(`Error fetching ${animalType} pets:`, error);
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

    // 犬と猫を統合し、ランダムIDの降順で並び替え
    const allPets = [...dogs, ...cats];
    const sortedPets = allPets.sort((a, b) => {
      // ランダムIDを数値として比較（大きいIDが先頭）
      const randomIdA = parseInt(a.randomId) || 0;
      const randomIdB = parseInt(b.randomId) || 0;
      return randomIdB - randomIdA;
    });

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
      orders: '-randomId',
      fields: [
        'id',
        'randomId',
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
      limit,
      offset
    };

    const response = await client.getList<Pet>({
      endpoint: API_ENDPOINTS.PETS,
      queries
    });
    
    return response.contents;
  } catch (error) {
    console.error('Error fetching pets with offset:', error);
    return [];
  }
}
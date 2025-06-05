import { client } from '../client';
import { API_ENDPOINTS, API_QUERY_PARAMS } from '../../constants';
import type { Pet } from './types';

export async function getLatestPetsByType(animalType: string, limit?: number): Promise<Pet[]> {
  try {
    const queries: any = {
      filters: `animalType[equals]${animalType}`,
      orders: API_QUERY_PARAMS.ORDERS.ID_DESC,
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
    const [dogs, cats] = await Promise.all([
      getLatestPetsByType('dog', limit),
      getLatestPetsByType('cat', limit)
    ]);

    return [...dogs, ...cats].sort((a, b) => b.id.localeCompare(a.id));
  } catch (error) {
    console.error('Error fetching all pets:', error);
    return [];
  }
}
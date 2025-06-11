import type { APIRoute } from 'astro';
import { getPetsWithOffset, getLatestPetsByType } from '../../lib/api/pets/queries';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '18');
    const animalType = searchParams.get('animalType');

    let pets;
    if (animalType && (animalType === 'dog' || animalType === 'cat')) {
      // 特定の動物種のみ取得
      const allPetsOfType = await getLatestPetsByType(animalType, offset + limit);
      pets = allPetsOfType.slice(offset);
    } else {
      // 全種類取得
      pets = await getPetsWithOffset(offset, limit);
    }

    return new Response(JSON.stringify(pets), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in pets API:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch pets' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
import type { APIRoute } from 'astro';
import { getVoices } from '../../lib/api/voice';

export const GET: APIRoute = async ({ url }) => {
  try {
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const voices = await getVoices(limit, offset);
    
    return new Response(JSON.stringify(voices), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in voice API:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch voices' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
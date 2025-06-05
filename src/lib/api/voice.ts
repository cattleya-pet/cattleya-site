import { client } from './client';
import type { MicroCMSResponse } from '../types';

export type Voice = {
  id: string;
  petName: string;
  petGender: string;
  petThumbnail: string;
  ownerName: string;
  animalType: string;
  store: string;
  voiceContent: string;
};

export async function getVoices(limit: number = 5): Promise<Voice[]> {
  try {
    const response = await client.getList<Voice>({
      endpoint: 'voice',
      queries: { limit }
    });
    return response.contents;
  } catch (error) {
    console.error('Error fetching voices:', error);
    return [];
  }
} 
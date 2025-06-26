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

export async function getVoices(limit: number = 5, offset: number = 0): Promise<Voice[]> {
  try {
    const response = await client.getList<Voice>({
      endpoint: 'voice',
      queries: { limit, offset }
    });
    return response.contents;
  } catch (error) {
    console.error('Error fetching voices:', error);
    return [];
  }
}

export async function getVoicesWithPagination(limit: number = 10, offset: number = 0): Promise<MicroCMSResponse<Voice>> {
  try {
    const response = await client.getList<Voice>({
      endpoint: 'voice',
      queries: { limit, offset }
    });
    return response;
  } catch (error) {
    console.error('Error fetching voices with pagination:', error);
    return {
      contents: [],
      totalCount: 0,
      offset: 0,
      limit: 0
    };
  }
}

export async function getVoiceById(id: string): Promise<Voice | null> {
  try {
    const response = await client.get<Voice>({
      endpoint: 'voice',
      contentId: id
    });
    return response;
  } catch (error) {
    console.error('Error fetching voice by ID:', error);
    return null;
  }
} 
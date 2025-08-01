import { client } from './client';
import { randomSort30Minutes } from '../utils/randomSort';
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
    console.log(`getVoices called with limit: ${limit}, offset: ${offset}`);
    
    // 全データを取得してからシャッフル・スライス
    const response = await client.getList<Voice>({
      endpoint: 'voice',
      queries: { limit: 100 } // microCMSの上限は100
    });
    
    console.log(`API response: ${response.contents.length} voices`);
    
    // 30分ごとのシャッフルを適用
    const shuffledVoices = randomSort30Minutes(response.contents);
    console.log(`After shuffle: ${shuffledVoices.length} voices`);
    
    // offsetとlimitを適用
    const result = shuffledVoices.slice(offset, offset + limit);
    console.log(`Final result: ${result.length} voices`);
    
    return result;
  } catch (error) {
    console.error('Error fetching voices:', error);
    return [];
  }
}

export async function getVoicesWithPagination(limit: number = 10, offset: number = 0): Promise<MicroCMSResponse<Voice>> {
  try {
    // 全データを取得してシャッフル
    const response = await client.getList<Voice>({
      endpoint: 'voice',
      queries: { limit: 100 } // microCMSの上限は100
    });
    
    // 30分ごとのシャッフルを適用
    const shuffledVoices = randomSort30Minutes(response.contents);
    
    // ページネーション用にスライス
    const paginatedVoices = shuffledVoices.slice(offset, offset + limit);
    
    return {
      contents: paginatedVoices,
      totalCount: response.totalCount,
      offset: offset,
      limit: limit
    };
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
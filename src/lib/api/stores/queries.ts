import { client } from '../client';
import { API_ENDPOINTS, API_QUERY_PARAMS } from '../../constants';
import type { Store, StoreListResponse } from './types';

/**
 * すべての店舗情報を取得する
 */
export async function getAllStores(): Promise<Store[]> {
  try {
    const response = await client.get<StoreListResponse>({
      endpoint: API_ENDPOINTS.STORES,
      queries: {
        limit: API_QUERY_PARAMS.LIMIT,
        orders: API_QUERY_PARAMS.ORDERS.ID_DESC
      }
    });
    
    return response.contents;
  } catch (error) {
    console.error('店舗情報の取得に失敗しました:', error);
    return [];
  }
}

/**
 * 特定のIDの店舗情報を取得する
 */
export async function getStoreById(id: string): Promise<Store | null> {
  try {
    const store = await client.get<Store>({
      endpoint: `${API_ENDPOINTS.STORES}/${id}`
    });
    
    return store;
  } catch (error) {
    console.error(`ID: ${id}の店舗情報の取得に失敗しました:`, error);
    return null;
  }
}
import type { MicroCMSContentId, MicroCMSDate, MicroCMSImage } from 'microcms-js-sdk';

// 店舗情報の型定義
export interface Store extends MicroCMSContentId, MicroCMSDate {
  storeName: string;
  storeImages?: MicroCMSImage[];
  storePostCode?: string;
  storeAddress?: string;
  trafficInformation?: string;
  businessHours?: string;
  storePhoneNumber?: string;
  storeLine?: string;
  description?: string;
}

// 店舗情報の一覧レスポンスの型定義
export interface StoreListResponse {
  contents: Store[];
  totalCount: number;
  offset: number;
  limit: number;
}
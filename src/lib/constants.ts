// MicroCMS認証情報
export const MICROCMS_SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
export const MICROCMS_API_KEY = process.env.MICROCMS_API_KEY;

// APIエンドポイント
export const API_ENDPOINTS = {
  PETS: 'individual',
  STORES: 'store',
  NEWS: 'news'
} as const;

// APIクエリパラメータ
export const API_QUERY_PARAMS = {
  LIMIT: 100,
  ORDERS: {
    CREATED_AT_DESC: '-createdAt',
    UPDATED_AT_DESC: '-updatedAt',
    ID_DESC: '-id'
  }
} as const;
import { createClient } from 'microcms-js-sdk';
import { MICROCMS_SERVICE_DOMAIN, MICROCMS_API_KEY } from '../constants';

if (!MICROCMS_SERVICE_DOMAIN) {
  throw new Error('MICROCMS_SERVICE_DOMAIN is not defined');
}

if (!MICROCMS_API_KEY) {
  throw new Error('MICROCMS_API_KEY is not defined');
}

// 改善されたメモリキャッシュ（30分）
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30分

// 簡単な無効データ判定（空オブジェクトのみチェック）
function isInvalidData(data: any): boolean {
  // null, undefined は無効
  if (!data) {
    return true;
  }
  
  // 空のオブジェクト {} のみ無効とする
  return typeof data === 'object' && Object.keys(data).length === 0;
}

export const client = createClient({
  serviceDomain: MICROCMS_SERVICE_DOMAIN,
  apiKey: MICROCMS_API_KEY,
});
import { createClient } from 'microcms-js-sdk';
import { MICROCMS_SERVICE_DOMAIN, MICROCMS_API_KEY } from '../constants';

if (!MICROCMS_SERVICE_DOMAIN) {
  throw new Error('MICROCMS_SERVICE_DOMAIN is not defined');
}

if (!MICROCMS_API_KEY) {
  throw new Error('MICROCMS_API_KEY is not defined');
}

// メモリキャッシュ（30分）
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30分

export const client = createClient({
  serviceDomain: MICROCMS_SERVICE_DOMAIN,
  apiKey: MICROCMS_API_KEY,
  customFetch: async (input, init) => {
    if (typeof input === 'string') {
      const url = new URL(input);
      const cacheKey = url.pathname + url.search;
      
      // キャッシュチェック
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return new Response(JSON.stringify(cached.data), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // APIリクエスト実行
      const response = await fetch(url.toString(), {
        ...init,
        headers: {
          ...init?.headers,
          'Cache-Control': 'max-age=1800', // 30分キャッシュ
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return response;
    }
    return fetch(input, init);
  }
});
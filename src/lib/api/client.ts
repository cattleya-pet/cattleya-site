import { createClient } from 'microcms-js-sdk';
import { MICROCMS_SERVICE_DOMAIN, MICROCMS_API_KEY } from '../constants';

if (!MICROCMS_SERVICE_DOMAIN) {
  throw new Error('MICROCMS_SERVICE_DOMAIN is not defined');
}

if (!MICROCMS_API_KEY) {
  throw new Error('MICROCMS_API_KEY is not defined');
}

export const client = createClient({
  serviceDomain: MICROCMS_SERVICE_DOMAIN,
  apiKey: MICROCMS_API_KEY,
  customFetch: (input, init) => {
    if (typeof input === 'string') {
      const url = new URL(input);
      // キャッシュバスティングのためのタイムスタンプを追加
      url.searchParams.set('timestamp', Date.now().toString());
      return fetch(url.toString(), init);
    }
    return fetch(input, init);
  }
});
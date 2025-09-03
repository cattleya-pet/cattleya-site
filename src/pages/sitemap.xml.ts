import type { APIRoute } from 'astro';
import { getLatestPetsByType } from '../lib/api/pets/queries';
import { getAllStores } from '../lib/api/stores';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://cattleya-pets.com';
  
  // 静的ページのURL
  const staticPages = [
    '',
    '/search',
    '/search/dogs',
    '/search/cats',
    '/search/dogs/mix',
    '/search/cats/mix',
    '/stores',
    '/flow',
    '/reserve',
    '/homestay',
    '/relief',
    '/voice',
    '/recruit',
    '/company',
    '/contact'
  ];

  // 動的ページの取得
  const dynamicUrls: string[] = [];

  try {
    // 店舗ページ
    const stores = await getAllStores();
    stores.forEach(store => {
      dynamicUrls.push(`/stores/${store.storeId}`);
    });

    // ペット詳細ページ（犬）
    const dogs = await getLatestPetsByType('dog');
    dogs.forEach(dog => {
      if (dog.breedTypeEn && dog.id) {
        const breedPath = dog.classification === 'mix' ? 'mix/' : '';
        dynamicUrls.push(`/search/dogs/${breedPath}${dog.breedTypeEn.toLowerCase()}/${dog.id}`);
      }
    });

    // ペット詳細ページ（猫）
    const cats = await getLatestPetsByType('cat');
    cats.forEach(cat => {
      if (cat.breedTypeEn && cat.id) {
        const breedPath = cat.classification === 'mix' ? 'mix/' : '';
        dynamicUrls.push(`/search/cats/${breedPath}${cat.breedTypeEn.toLowerCase()}/${cat.id}`);
      }
    });

    // 品種別ページ
    const dogBreeds = [...new Set(dogs.map(dog => dog.breedTypeEn?.toLowerCase()).filter(Boolean))];
    const catBreeds = [...new Set(cats.map(cat => cat.breedTypeEn?.toLowerCase()).filter(Boolean))];

    dogBreeds.forEach(breed => {
      dynamicUrls.push(`/search/dogs/${breed}`);
      dynamicUrls.push(`/search/dogs/mix/${breed}`);
    });

    catBreeds.forEach(breed => {
      dynamicUrls.push(`/search/cats/${breed}`);
      dynamicUrls.push(`/search/cats/mix/${breed}`);
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  // XMLサイトマップを生成
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page === '' ? 'daily' : page.includes('/search') ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : page.includes('/search') ? '0.8' : '0.7'}</priority>
  </url>`).join('\n')}
${dynamicUrls.map(url => `  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${url.includes('/stores/') ? 'weekly' : 'daily'}</changefreq>
    <priority>${url.includes('/stores/') ? '0.8' : '0.6'}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
};
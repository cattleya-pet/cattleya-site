import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  // 静的生成（デフォルト）+ 個別ページでSSR指定
  // Astro 5.0以降、hybridはstaticに統合されました
  output: 'static',
  adapter: vercel(),
  image: {
    // 画像最適化設定
    service: {
      entrypoint: 'astro/assets/services/sharp'
    },
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.microcms-assets.io'
      },
      {
        protocol: 'https', 
        hostname: 'files.microcms-assets.io'
      }
    ]
  },
  vite: {
    build: {
      cssMinify: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.warn', 'console.error']
        }
      }
    },
    optimizeDeps: {
      include: ['microcms-js-sdk']
    }
  }
});
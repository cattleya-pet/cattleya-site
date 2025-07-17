import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  // サーバーサイドレンダリング（SSR）
  output: 'server',
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
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['microcms-js-sdk']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['microcms-js-sdk']
    }
  }
});
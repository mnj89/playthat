import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: 'PlayThat! PRO Media Player',
          short_name: 'PlayThat!',
          description: 'High-performance Android media player with MX gesture controls and AES-GCM encrypted vault.',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      {
        name: 'stream-cors-proxy',
        configureServer(server) {
          server.middlewares.use('/api/stream-proxy', async (req, res) => {
            try {
              const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
              const targetUrl = urlObj.searchParams.get('url');

              if (!targetUrl) {
                res.statusCode = 400;
                res.end('Missing url query parameter');
                return;
              }

              const response = await fetch(targetUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Linux; Android 14; PlayThat)',
                  Accept: '*/*',
                },
              });

              res.statusCode = response.status;
              response.headers.forEach((val, key) => {
                // Strip restrictive headers
                if (!['content-security-policy', 'access-control-allow-origin'].includes(key.toLowerCase())) {
                  res.setHeader(key, val);
                }
              });
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

              if (response.body) {
                // @ts-ignore
                const arrayBuffer = await response.arrayBuffer();
                res.end(Buffer.from(arrayBuffer));
              } else {
                res.end();
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.end(`Proxy error: ${err.message}`);
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

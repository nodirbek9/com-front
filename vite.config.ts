import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The backend has no CORS configuration at all, deliberately - same-origin only. In dev, every
// API call is proxied through this dev server to the real Spring Boot instance so the browser
// never sees a cross-origin request. In production the same job is done by nginx (see
// nginx.conf.template) - the frontend code itself never needs to know which.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080';
  const proxy = { target, changeOrigin: true } as const;
  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    server: {
      port: 5173,
      proxy: {
        '/api': proxy,
        // TaskController is the one controller mapped outside the /api prefix.
        '/tasks': proxy,
        '/v3/api-docs': proxy,
        '/swagger-ui': proxy,
      },
    },
    preview: { port: 5173 },
  };
});

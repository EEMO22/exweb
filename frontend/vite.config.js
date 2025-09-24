import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// React 19 + Tailwind CSS v4 최적화 설정
export default defineConfig({
  plugins: [
    react({
      // React 19 최적화 옵션
      jsxRuntime: 'automatic', // 자동 JSX 런타임 (React 17+)
    }),
    tailwindcss(), // Tailwind CSS v4 플러그인
  ],
  server: {
    port: 3000, // 개발 서버 포트
    host: true, // 네트워크에서 접근 가능
    proxy: {
      // API 요청을 Django 백엔드로 프록시
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // CORS 관련 헤더 추가
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(
              'Received Response from the Target:',
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // 디버깅용 소스맵 생성
    // React 19 최적화
    rollupOptions: {
      output: {
        manualChunks: {
          // vendor 청크 분리로 캐싱 최적화
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  // React 19 개발 환경 최적화
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});

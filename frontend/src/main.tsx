/**
 * React 애플리케이션의 진입점
 *
 * 역할:
 * 1. React DOM에 애플리케이션 마운트
 * 2. 전역 스타일 로드
 * 3. StrictMode로 개발 환경 최적화
 *
 * Guidelines: React 19 + functional components with Hooks + TypeScript
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// TypeScript: 타입 안전성을 위한 null 체크
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

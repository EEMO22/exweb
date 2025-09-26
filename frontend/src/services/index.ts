/**
 * API 서비스 통합 인덱스
 */

// API 클라이언트와 유틸리티
export { default as apiClient, tokenManager, handleApiError } from './api';

// 도메인별 API 함수들
export { authAPI } from './api/auth';
export { userAPI } from './api/user';

// 타입들 re-export (편의성을 위해)
export type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ApiError,
} from '../types';

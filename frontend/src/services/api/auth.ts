/**
 * 인증 관련 API 함수들
 * Guidelines: Separation of Concerns - 인증 로직만 담당
 */

import type { AxiosError } from 'axios';
import type { LoginCredentials, RegisterData, AuthResponse } from '../../types';
import { apiClient, handleApiError, tokenManager } from './index';

/**
 * 인증 API 객체
 * Why: 네임스페이스로 관련 함수들을 그룹화하여 일관성 유지
 * Guidelines: Consistency is key
 */
export const authAPI = {
  /**
   * 회원가입
   * @param userData 회원가입 데이터
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    // 제네릭 타입으로 설정하는 이유가 뭐지?
    // -> API 응답의 구조를 명확하게 정의하여 타입 안전성을 높이기 위함
    // -> 응답 데이터의 타입을 자동으로 추론할 수 있어 개발 편의성이 증가
    // -> 코드 작성 시 타입 오류를 사전에 방지할 수 있음
    // -> API 응답 구조가 변경될 경우, 타입 정의만 수정하면 되므로 유지보수가 용이
    try {
      const response = await apiClient.post<AuthResponse>(
        '/auth/register/',
        userData
      );

      // Guidelines: Security First - 토큰을 안전한 쿠키에 저장
      if (response.data.tokens) {
        tokenManager.setAccessToken(response.data.tokens.access);
        tokenManager.setRefreshToken(response.data.tokens.refresh);
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },

  /**
   * 로그인
   * @param credentials 로그인 정보 (email, password)
   * Why: Stateless API - JWT 토큰 기반 인증 사용
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        '/auth/login/',
        credentials
      );

      // 로그인 성공 시 토큰을 쿠키에 저장
      if (response.data.tokens) {
        tokenManager.setAccessToken(response.data.tokens.access);
        tokenManager.setRefreshToken(response.data.tokens.refresh);
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },

  /**
   * 로그아웃
   * Why: 백엔드에 로그아웃 요청을 보내고 토큰을 무효화
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = tokenManager.getRefreshToken();

      if (refreshToken) {
        // 백엔드에 로그아웃 요청 (토큰 블랙리스트 등록)
        await apiClient.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      // 로그아웃 에러는 로깅만 하고 진행
      console.error('Logout error', error);
    } finally {
      tokenManager.clearTokens();
    }
  },

  /**
   * 현재 로그인 상태 확인
   * Why: 토큰 존재 여부로 로그인 상태를 판단
   */
  isAuthenticated(): boolean {
    return !!tokenManager.getAccessToken();
  },
};

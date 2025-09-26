/**
 * API 클라이언트와 공통 유틸리티
 * Guidelines: Separation of Concerns - API 설정을 중앙집중화
 */

import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import type { ApiError } from '../../types';

// 환경 변수에서 API URL 가져오기
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 쿠키 키 상수 - Guidelines: Consistency is key
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * 쿠키 기반 토큰 관리자
 * Why: Security First - XSS 보호를 위한 쿠키 사용
 */
export const tokenManager = {
  /**
   * 액세스 토큰을 쿠키에 저장
   * @param token JWT 액세스 토큰
   */
  setAccessToken: (token: string) => {
    Cookies.set(ACCESS_TOKEN_KEY, token, {
      expires: 1 / 24, // 1시간
      secure: import.meta.env.PROD, // Production에서만 HTTPS 요구
      sameSite: 'strict', // CSRF 공격 방지
    });
  },

  /**
   * 리프레시 토큰을 쿠키에 저장
   * @param token JWT 리프레시 토큰
   */
  setRefreshToken: (token: string) => {
    Cookies.set(REFRESH_TOKEN_KEY, token, {
      expires: 7, // 7일
      secure: import.meta.env.PROD,
      sameSite: 'strict',
      httpOnly: false, // JavaScript에서 접근 가능해야 함
    });
  },

  /**
   * 액세스 토큰 가져오기
   */
  getAccessToken: (): string | undefined => {
    return Cookies.get(ACCESS_TOKEN_KEY);
  },

  /**
   * 리프레시 토큰 가져오기
   */
  getRefreshToken: (): string | undefined => {
    return Cookies.get(REFRESH_TOKEN_KEY);
  },

  /**
   * 모든 토큰 제거 (로그아웃 시)
   */
  clearTokens: () => {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
  },
};

/**
 * Axios 인스턴스 생성
 * Why: 중앙집중식 설정 관리와 인터셉터 적용
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키를 포함한 요청 허용
});

/**
 * 요청 인터셉터 - JWT 토큰 자동 추가
 * Why: Stateless API 원칙 준수
 */
apiClient.interceptors.request.use(
  config => {
    const token = tokenManager.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 개발 환경에서만 로깅
    if (import.meta.env.DEV) {
      console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    }

    return config;
  },
  error => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터 - 토큰 갱신 및 에러 처리
 * Why: Comprehensive error handling
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', response.status, response.config.url);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // 401 에러 시 토큰 갱신 시도
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as any)._retry
    ) {
      (originalRequest as any)._retry = true; // 무한 루프 방지

      try {
        const refreshToken = tokenManager.getRefreshToken();

        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/token-refresh/`,
            {
              refresh: refreshToken,
            }
          );

          const { access } = response.data;
          tokenManager.setAccessToken(access);

          originalRequest.headers!.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('🔄 Token refresh failed:', refreshError);
        tokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    console.error('❌ API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

/**
 * API 에러 처리 유틸리티 함수
 * Why: 일관된 에러 메시지 처리
 */
export function handleApiError(error: AxiosError): ApiError {
  if (error.response?.data) {
    const serverError = error.response.data as any;

    if (typeof serverError === 'object') {
      const errorMessages: string[] = [];

      Object.entries(serverError).forEach(([, messages]) => {
        if (Array.isArray(messages)) {
          errorMessages.push(...messages);
        } else if (typeof messages === 'string') {
          errorMessages.push(messages);
        }
      });

      return {
        message: errorMessages.join(' ') || '요청 처리 중 오류가 발생했습니다.',
        details: serverError,
      };
    }

    return {
      message: serverError.message || '요청 처리 중 오류가 발생했습니다.',
    };
  } else if (error.request) {
    return {
      message: '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.',
    };
  }

  return {
    message: error.message || '알 수 없는 오류가 발생했습니다.',
  };
}

export { apiClient as default };
export { apiClient };

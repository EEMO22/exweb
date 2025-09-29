/**
 * 인증 상태 관리 스토어
 * Guidelines: Zustand for complex/shared state management
 * Why: 인증 상태는 앱 전체에서 공유되므로 전역 상태 관리 필요
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData } from '../types';
import { authAPI } from '../services/api/auth';
import { userAPI } from '../services/api/user';

/**
 * 인증 스토어 상태 인터페이스
 * Why: TypeScript strict type checking for state management
 */
interface AuthState {
  // 상태 데이터
  readonly user: User | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;

  // 액션 함수들
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * 인증 스토어 생성
 * Why: 중앙집중식 인증 상태 관리로 일관성 보장
 * Guidelines: Security First - 토큰 기반 인증 상태 관리
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        /**
         * 로그인 액션
         * Why: API 호출과 상태 업데이트를 하나의 액션으로 캡슐화
         * @param credentials 로그인 정보
         */
        login: async (credentials: LoginCredentials) => {
          try {
            set({ isLoading: true, error: null });

            const response = await authAPI.login(credentials);

            // Guidelines: Stateless API - JWT 토큰은 authAPI에서 자동 관리됨
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error: any) {
            // Guidelines: Comprehensive error handling
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error.message || '로그인에 실패했습니다.',
            });
            throw error; // 컴포넌트에서 추가 처리할 수 있도록 재throw
          }
        },

        /**
         * 회원가입 액션
         * Why: 회원가입과 동시에 자동 로그인 처리
         * @param userData 회원가입 데이터
         */
        register: async (userData: RegisterData) => {
          try {
            set({ isLoading: true, error: null });

            const response = await authAPI.register(userData);

            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error: any) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error.message || '회원가입에 실패했습니다.',
            });
            throw error;
          }
        },

        /**
         * 로그아웃 액션
         * Why: 백엔드 로그아웃 + 클라이언트 상태 초기화
         */
        logout: async () => {
          try {
            set({ isLoading: true });

            await authAPI.logout();

            // 상태 초기화
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          } catch (error: any) {
            // 로그아웃 에러가 발생해도 클라이언트 상태는 초기화
            console.error('Logout error:', error);
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        },

        /**
         * 사용자 정보 로드 (앱 시작 시 또는 토큰 갱신 후)
         * Why: 페이지 새로고침 시 사용자 상태 복원
         */
        loadUser: async () => {
          try {
            // 토큰이 없으면 로드하지 않음
            if (!authAPI.isAuthenticated()) {
              set({ isAuthenticated: false, user: null });
              return;
            }

            set({ isLoading: true, error: null });

            const user = await userAPI.getProfile();

            set({
              user: user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error: any) {
            // 토큰이 유효하지 않은 경우
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null, // 사용자에게 보여줄 필요 없는 에러
            });
          }
        },

        /**
         * 에러 상태 클리어
         * Why: 사용자가 에러 메시지를 확인한 후 제거할 수 있도록
         */
        clearError: () => {
          set({ error: null });
        },

        /**
         * 로딩 상태 설정
         * Why: 외부에서 로딩 상태를 제어할 수 있도록
         * @param loading 로딩 상태
         */
        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },
      }),
      {
        name: 'auth-storage', // localStorage 키
        // Guidelines: Security First - 민감한 정보는 persist하지 않음
        partialize: state => ({
          // 토큰은 쿠키에 저장되므로 user 정보만 persist
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store', // DevTools에서 표시될 이름
    }
  )
);

/**
 * 전역 타입 정의
 * Guidelines: 백엔드 Django 모델과 정확히 일치하는 타입 정의
 * Why: 프론트엔드-백엔드 간 데이터 교환의 타입 안전성 보장
 */

// ========== 사용자 관련 타입 ==========
export interface User {
  readonly id: number;
  email: string; // USERNAME_FIELD, unique, db_index
  username: string; // Django 기본 필드 (required)
  display_name: string; // max_length=50, 포트폴리오용 공개 이름

  // 프로필 정보
  bio: string; // max_length=500, blank=True
  specialization: string; // max_length=100, 디자인 전문분야
  years_of_experience: number | null; // PositiveSmallIntegerField, null=True

  // 연락처 정보
  website: string; // URLField, blank=True
  phone_number: string; // 정규식 검증, max_length=17

  // 이미지 및 설정
  profile_image: string | null; // ImageField, upload_to="profiles/%Y/%m/"
  is_portfolio_public: boolean; // default=True

  // Django 기본 필드들
  is_active: boolean; // Django AbstractUser 기본 필드
  readonly date_joined: string; // DateTime, Django 기본 필드
  readonly updated_at: string; // auto_now=True

  // 모델 메서드들 (계산된 필드)
  readonly full_display_name: string; // get_full_display_name() 메서드 결과
  readonly is_experienced_designer: boolean; // is_experienced_designer() 메서드 결과
  readonly portfolio_url: string; // get_portfolio_url() 메서드 결과
}

// ========== 인증 관련 타입 ==========
export interface LoginCredentials {
  email: string; // USERNAME_FIELD가 email이므로
  password: string;
}

export interface RegisterData {
  // 필수 필드들 (REQUIRED_FIELDS + password)
  email: string;
  username: string;
  display_name: string;
  password: string;
  password_confirm: string; // 프론트엔드 검증용

  // 선택 필드들 (회원가입 시 입력 가능)
  bio?: string;
  specialization?: string;
  years_of_experience?: number | null;
  website?: string;
  phone_number?: string;
}

export interface AuthTokens {
  access: string; // JWT access token (짧은 수명)
  refresh: string; // JWT refresh token (긴 수명)
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ========== API 응답 타입 ==========
export interface ApiError {
  message: string;
  details?: Record<string, string[]>; // DRF 에러 형식
}

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

// ========== 폼 관련 타입 ==========
export interface FormFieldError {
  message: string;
}

export interface FormErrors {
  [key: string]: FormFieldError[];
}

// ========== 상태 관리 관련 타입 ==========
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// ========== 컴포넌트 Props 타입 ==========
export interface ComponentWithChildren {
  children: React.ReactNode;
}

export interface PageProps {
  className?: string;
}

// ========== 유틸리티 타입 ==========
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireOnly<T, K extends keyof T> = Pick<T, K> &
  Partial<Omit<T, K>>;

// ========== 포트폴리오 관련 타입 (향후 확장용) ==========
export interface PortfolioPermissions {
  can_view: boolean; // can_view_portfolio() 메서드 결과
  can_edit: boolean;
}

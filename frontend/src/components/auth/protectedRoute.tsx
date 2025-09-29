/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 * Guidelines: Security First - 인증되지 않은 사용자 접근 차단
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { ComponentWithChildren } from '@/types';

/**
 * 보호된 라우트 래퍼 컴포넌트
 * Why: 인증 상태에 따른 조건부 렌더링
 * @param children 보호할 컴포넌트
 */
function ProtectedRoute({ children }: ComponentWithChildren) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // 로딩 중일 때는 로딩 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  // Why: 현재 위치를 state로 저장하여 로그인 후 원래 페이지로 돌아갈 수 있도록 함
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 인증된 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
}

export default ProtectedRoute;

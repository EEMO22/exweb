/**
 * 로그인 페이지 컴포넌트
 * Guidelines: Functional components with Hooks, Tailwind CSS v4
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { LoginCredentials } from '@/types';

/**
 * 로그인 페이지 컴포넌트
 * Why: 사용자 인증을 위한 UI와 로직 제공
 */
function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();

  // 폼 상태 관리
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  // 로그인 후 리다이렉트할 경로 (ProtectedRoute에서 전달된 원래 위치)
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  /**
   * 입력 필드 변경 핸들러
   * Why: 제어 컴포넌트 패턴으로 입력 상태 관리
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // setFormData는 어떤 작동을 하지?
    // setFormData는 React의 useState 훅에서 제공하는 상태 업데이트 함수입니다.
    // 이 함수는 상태 변수(formData)의 값을 변경하는 데 사용됩니다.
    // 위 코드에서 setFormData는 입력 필드의 값이 변경될 때마다 호출되어,
    // formData 객체의 해당 필드(name)에 새로운 값(value)을 설정합니다.
    // 예를 들어, 사용자가 이메일 입력 필드에 "test@example.com"을 입력하면,
    // formData.email은 "test@example.com"으로 업데이트됩니다.
    // prev는 이전 상태를 나타내며, 이를 복사하여 새로운 상태 객체를 생성하고,
    // 변경된 필드만 덮어쓰는 방식으로 상태를 관리합니다.

    if (error) {
      clearError();
    }
  };

  /**
   * 로그인 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(formData);
      // 로그인 성공 시 원래 위치로 리다이렉트
      navigate(from, { replace: true });
    } catch (error) {
      // 에러는 Zustand 스토어에서 관리하므로 별도 처리 불필요
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            계정에 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            또는{' '}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              새 계정 만들기
            </Link>
          </p>
        </div>

        {/* 로그인 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* 이메일 입력 */}
          <label htmlFor="email" className="sr-only">
            이메일 주소
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="이메일 주소"
            value={formData.email}
            onChange={handleInputChange}
          />

          {/* 비밀번호 입력 */}
          <div>
            <label htmlFor="password" className="sr-only">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="비밀번호"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>

          {/* 로그인 버튼 */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;

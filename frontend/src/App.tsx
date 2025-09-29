/**
 * 앱 루트 컴포넌트
 * Guidelines: Functional components with Hooks
 * Why: React Router와 전역 상태 관리 통합
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// 페이지 컴포넌트들 (생성 예정)
// import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
// import RegisterPage from './pages/auth/RegisterPage';
// import DashboardPage from './pages/DashboardPage';
// import ProtectedRoute from './components/auth/ProtectedRoute';

/**
 * 앱 메인 컴포넌트
 * Why: 라우팅과 인증 상태 초기화를 담당
 */
function App() {
  // Zustand 스토어에서 상태와 액션 추출
  const { loadUser, isAuthenticated, isLoading } = useAuthStore();

  /**
   * 앱 시작 시 사용자 상태 복원
   * Why: 페이지 새로고침 시에도 로그인 상태 유지
   */
  useEffect(() => {
    loadUser();
  }, [loadUser]);
  // useEffect에 대해 설명해줘.
  // useEffect는 React의 Hook 중 하나로, 함수형 컴포넌트에서 부수 효과(side effects)를 처리하기 위해 사용됩니다.
  // 부수 효과란 컴포넌트의 렌더링 외에 발생하는 작업들을 의미합니다. 예를 들어, 데이터 fetching, 구독 설정, DOM 조작 등이 이에 해당합니다.
  // useEffect는 두 개의 인자를 받습니다:
  // 1. 첫 번째 인자는 실행할 함수입니다. 이 함수는 컴포넌트가 렌더링된 후에 호출됩니다.
  // 2. 두 번째 인자는 의존성 배열(dependency array)로, 이 배열에 포함된 값이 변경될 때마다 첫 번째 인자가 다시 실행됩니다. 만약 빈 배열([])을 전달하면, 이 효과는 컴포넌트가 처음 마운트될 때만 실행됩니다.
  // 예를 들어, 위 코드에서 useEffect는 컴포넌트가 처음 렌더링될 때 loadUser 함수를 호출하여 사용자 상태를 복원합니다. loadUser 함수는 의존성 배열에 포함되어 있으므로, 이 함수가 변경되지 않는 한 다시 호출되지 않습니다.
  // 요약하자면, useEffect는 컴포넌트의 생명주기 동안 특정 작업을 수행할 수 있게 해주는 강력한 도구입니다.

  // 초기 로딩 중일 때 로딩 스피너 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* <Route path="/" element={<HomePage />} /> */}
          <Route path="/login" element={<LoginPage />} />
          {/* <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;

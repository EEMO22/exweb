"""
URL configuration for accounts app.
Guidelines: Use DRF routers for ViewSets, following RESTful patterns
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AuthViewSet, UserProfileViewSet

# DRF Router for automatic URL generation
# Router의 역할: ViewSet의 메서드들을 자동으로 URL 패턴으로 변환
router = DefaultRouter()

# ViewSet 등록 - basename은 URL 패턴 이름의 접두사로 사용됨
router.register(r"auth", AuthViewSet, basename="auth")
router.register(r"users", UserProfileViewSet, basename="users")
# r 은 뭐지?
# r은 raw string을 의미하며, 이스케이프 문자를 무시하고 문자열을 그대로 사용하게 함

"""
router.register()가 자동으로 생성하는 URL 패턴:

AuthViewSet (@action 기반):
- POST /api/auth/register/ → AuthViewSet.register
- POST /api/auth/login/    → AuthViewSet.login  
- POST /api/auth/logout/   → AuthViewSet.logout

UserProfileViewSet (ModelViewSet + @action):
- GET    /api/users/me/    → UserProfileViewSet.me (GET)
- PUT    /api/users/me/    → UserProfileViewSet.me (PUT)
- PATCH  /api/users/me/    → UserProfileViewSet.me (PATCH)

추가로 ModelViewSet은 표준 CRUD도 자동 생성:
- GET    /api/users/       → UserProfileViewSet.list
- POST   /api/users/       → UserProfileViewSet.create
- GET    /api/users/{id}/  → UserProfileViewSet.retrieve
- PUT    /api/users/{id}/  → UserProfileViewSet.update
- PATCH  /api/users/{id}/  → UserProfileViewSet.partial_update
- DELETE /api/users/{id}/  → UserProfileViewSet.destroy
"""

urlpatterns = [
    # DRF Router가 생성한 모든 URL 패턴을 포함
    # Guidelines: Centralize routing logic using DRF patterns
    path("", include(router.urls)),
]

"""
최종 URL 구조:
/api/auth/register/  → 회원가입
/api/auth/login/     → 로그인
/api/auth/logout/    → 로그아웃
/api/users/me/       → 내 프로필 관리
"""

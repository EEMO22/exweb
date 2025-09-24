"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

# Main URL patterns - 각 앱의 URL을 중앙에서 관리
urlpatterns = [
    # Django Admin - 개발 및 관리용 웹 인터페이스
    path("admin/", admin.site.urls),
    # API 엔드포인트 - 모든 API는 /api/ 접두사 사용
    path("api/", include("accounts.urls")),
    # 추가 작업할 앱들의 URL 패턴:
    # path("api/", include('portfolio.urls')),
    # path("api/", include('community.urls')),
]

# Development: Serve media files during development only
# Guidelines: Security First - 프로덕션에서는 웹서버(nginx)가 처리
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# 이 부분에 대해 설명해줘
# - settings.DEBUG가 True일 때(개발 환경에서) 미디어 파일을 제공하기 위한 URL 패턴을 추가
# 개발환경에서 미디어 파일을 제공한다는 게 무슨 뜻이지?
# - 개발 환경에서는 Django가 미디어 파일(사용자가 업로드한 이미지 등)을 직접 제공
# - 하지만 프로덕션 환경에서는 보안과 성능을 위해 nginx 같은 웹 서버가 처리
# 장고가 apache나 nginx같은 웹서버처럼 정적 파일을 제공한다고?
# - 네, 개발 환경에서는 Django가 정적 및 미디어 파일을 제공할 수 있지만,
# - 프로덕션 환경에서는 전문 웹 서버가 이를 처리하는 것이 일반적입니다.

"""
최종 URL 매핑:

Development URLs:
- http://localhost:8000/admin/              → Django Admin
- http://localhost:8000/api/auth/register/  → 회원가입 API
- http://localhost:8000/api/auth/login/     → 로그인 API  
- http://localhost:8000/api/auth/logout/    → 로그아웃 API
- http://localhost:8000/api/users/me/       → 프로필 관리 API
- http://localhost:8000/media/              → 업로드된 파일들 (개발용)

Production URLs:
- https://yourdomain.com/api/...            → API endpoints
- https://yourdomain.com/media/             → Static files (nginx)
"""

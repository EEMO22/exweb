"""
Maiu URL 설정
Why: /api/maiu/ 하위의 모든 동영상 관련 API 라우팅
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaiuVideoViewSet

router = DefaultRouter()
router.register(r"videos", MaiuVideoViewSet, basename="maiu-videos")

urlpatterns = [
    path("", include(router.urls)),
]

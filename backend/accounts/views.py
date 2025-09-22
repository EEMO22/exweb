#  views.py
#  클라이언트의 HTTP 요청을 받아서 응답을 반환하는 역할.
#  MVC 패턴에서의 Controller 역할을 수행.
#  Django REST Framework(DRF)의 View 또는 ViewSet을 사용.

"""
웹 요청 처리 흐름:

1. 클라이언트 (React) → HTTP 요청 (GET, POST, PUT, DELETE)
   예: POST /api/auth/login/ {"email": "test@test.com", "password": "123"}

2. Django URLs → 적절한 View로 라우팅

3. View → 요청 처리 및 응답 생성
   - 데이터 검증 (Serializer 사용)
   - 비즈니스 로직 실행 (Model 메서드 호출)
   - JSON 응답 반환

4. 클라이언트 (React) ← HTTP 응답 (JSON)
   예: {"user": {...}, "tokens": {...}, "message": "Login successful"}
"""

from django.shortcuts import render

# Create your views here.

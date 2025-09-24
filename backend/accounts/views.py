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

# Django 기본 라이브러리
from typing import Any, Dict, cast
from django.contrib.auth import get_user_model

# DRF (Django REST Framework) 라이브러리
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import PermissionDenied


# 우리가 만든 Serializer들 가져오기
from .serializers import (
    UserLoginSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
)

from .models import User

# User 모델 가져오기 (import 위치 최적화)
UserModel = get_user_model()
# User 모델은 Django의 기본 User 모델을 사용하므로 별도로 import 할 필요 없음
# get_user_model() 함수는 어떤 함수?
# -> Django의 인증 시스템에서 현재 활성화된 User 모델을 반환하는 함수


class AuthViewSet(viewsets.GenericViewSet):
    """
    인증 관련 API를 처리하는 ViewSet

    ViewSet이란?
    - Django REST Framework에서 제공하는 클래스
    - 관련된 여러 API 엔드포인트를 하나의 클래스로 그룹화
    - 자동으로 URL 라우팅 생성

    GenericViewSet vs ModelViewSet:
    - GenericViewSet: 커스텀 액션만 정의 (회원가입, 로그인 등)
    - ModelViewSet: 표준 CRUD 자동 제공 (Create, Read, Update, Delete)

    Guidelines: Stateless API - JWT 토큰 사용, 세션 사용 금지
    """

    # 인증되지 않은 사용자도 접근 가능 (회원가입, 로그인용)
    permission_classes = [AllowAny]

    @action(detail=False, methods=["post"])
    def register(self, request):
        """
        회원가입 API 엔드포인트

        URL: POST /api/auth/register/
        요청 데이터: {
            "email": "user@example.com",
            "username": "username",
            "display_name": "표시 이름",
            "password": "password123",
            "password_confirm": "password123",
        }

        @action 데코레이터:
        - 기본 CRUD(Create, Retrieve, Update, Delete) 작업으로 제공되지 않는
            사용자 정의 작업 또는 추가적인 엔드포인트를 정의하는 데 사용
        - detail=False: 특정 객체가 아닌 컬렉션에 대한 액션
        - methods=['post']: POST 요청만 허용

        Args:
            request: HTTP 요청 객체 (클라이언트에서 보낸 데이터 포함)

        Returns:
            Response: JSON 형태의 HTTP 응답
        """

        # 1. 클라이언트 데이터를 Serializer로 검증
        serializer = UserRegistrationSerializer(data=request.data)

        # 2. 데이터 유효성 검사
        if serializer.is_valid():
            # 3. 검증된 데이터로 사용자 생성
            user = cast(User, serializer.save())  # 내부적으로 serializer.create() 호출

            # 4. 회원가입 시 로그인 토큰 생성 (추후 변경 가능)
            refresh = RefreshToken.for_user(user)
            # user에 빨간 밑줄.
            # "Unknown | list[Unknown] | Any" 형식의 인수를 "for_user" 함수에서 "AuthUser@for_user" 형식의 "user" 매개 변수에 할당할 수 없습니다.
            # 형식 "Unknown | list[Unknown] | Any"을 제한된 형식 변수 "AuthUser"에 할당할 수 없습니다.PylancereportArgumentType
            # (variable) user: Unknown | list[Unknown] | Any

            # 5. 사용자 프로필 데이터 준비
            user_data = UserProfileSerializer(user).data

            #  6. 성공 응답 반환
            return Response(
                {
                    "user": user_data,
                    "tokens": {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                    },
                    "message": "회원가입이 성공적으로 완료되었습니다.",
                },
                status=status.HTTP_201_CREATED,
            )

        # 7. 검증 실패 시 에러 응답
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"])
    def login(self, request):
        """
        로그인 API 엔드포인트

        URL: POST /api/auth/login/
        요청 데이터: {
            "email": "user@example.com",
            "password": "password123"
        }
        """

        # 1. 로그인 데이터 검증 및 인증
        serializer = UserLoginSerializer(
            data=request.data,
            context={"request": request},  # authenticate() 함수를 위한 컨택스트
        )

        # 2. 인증 정보 유효성 검사
        if serializer.is_valid():
            # Practical approach: Direct access with type ignore
            # is_valid() 이후에는 validated_data가 반드시 존재함
            # 타입 체킹 우회
            validated_data = serializer.validated_data  # type: ignore

            # 3. 검증된 사용자 정보 추출
            user = cast(User, validated_data["user"])  # type: ignore
            refresh_token = str(validated_data["refresh"])  # type: ignore
            access_token = str(validated_data["access"])  # type: ignore

            # 4. 사용자 프로필 데이터 준비
            user_data = UserProfileSerializer(user).data

            # 5. 성공 응답 반환 (JWT 토큰 포함)
            return Response(
                {
                    "user": user_data,
                    "tokens": {
                        "refresh": refresh_token,
                        "access": access_token,
                        # serializer.validated_data 에 빨간 밑줄.
                        # "__getitem__" 메서드가 "empty" 형식에 정의되지 않았습니다.PylancereportIndexIssue
                        # ’None’ 유형의 개체는 아래 첨자를 사용할 수 없습니다.PylancereportOptionalSubscript
                    },
                    "message": "로그인되었습니다",
                },
                status=status.HTTP_200_OK,
            )

        # 6. 인증 실패 시 에러 응답
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"])
    def logout(self, request):
        """
        로그아웃 API 엔드포인트

        URL: POST /api/auth/logout/
        요청 데이터: {
            "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
        }

        JWT는 Stateless이므로 서버에서 토큰을 무효화하려면
        토큰을 블랙리스트에 추가해야 함
        """
        try:
            # 1. 요청에서 refresh 토큰 추출
            refresh_token = request.data["refresh"]

            # 2. 토큰 객체 생성 및 블랙리스트 추가
            token = RefreshToken(refresh_token)
            token.blacklist()  # django-rest-framework-simplejwt의 토큰 무효화 처리

            # 3. 성공 응답 반환
            return Response(
                {"message": "로그아웃되었습니다."}, status=status.HTTP_200_OK
            )

        except Exception as e:
            # 4. 오류 처리 (예: 토큰이 유효하지 않음)
            return Response(
                {"error": "유효하지 않은 토큰입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    사용자 프로필 관리를 위한 ViewSet

    ModelViewSet이란?
    - 표준 CRUD 작업을 자동으로 제공하는 ViewSet
    - Create, Read, Update, Delete 메서드가 자동 생성됨
    - 커스텀 액션도 추가 가능

    사용 시점:
    - 모델과 1:1 대응되는 표준적인 API
    - CRUD 작업이 주요 기능인 경우

    보안 정책:
    1. 인증된 사용자만 접근 가능
    2. 자신의 프로필만 수정 가능 (현재)
    3. 다른 사용자 프로필 조회 차단 (현재)
    4. 향후 공개 프로필 기능 시 권한 로직 확장 예정
    """

    # 이 ViewSet에서 사용할 Serializer 지정
    serializer_class = UserProfileSerializer

    # 인증된 사용자만 접근 가능
    permission_classes = [IsAuthenticated]
    # 이런 식으로 사용되는 permission_classes 변수는 어디에서 왔으며, 어디에 적용되는 것?
    # - Django REST Framework의 ViewSet에서 사용되는 권한 설정 변수
    # - 특정 ViewSet 또는 API 엔드포인트에 대한 접근 권한을 제어
    # 변수 이름은 상관 없나?
    # - 네, 변수 이름은 상관없지만, Django REST Framework에서 권한 설정을 위해
    #   관례적으로 permission_classes라는 이름을 사용
    # 이 변수는 사용되는 곳이 없어 보이는데?
    # - 이 변수는 ViewSet 클래스 내에서 사용되며,
    #   해당 ViewSet에 대한 접근 권한을 제어하는 데 사용됨

    def get_queryset(self):
        """
        이 ViewSet에서 사용할 QuerySet 정의

        QuerySet 최적화:
        - N+1 문제 방지를 위한 select_related 사용
        - 비활성 사용자 제외

        Guidelines: 성능 최적화를 위한 쿼리 최적화

        Returns:
            QuerySet: 최적화된 User 쿼리셋
        """
        return User.objects.select_related().filter(
            is_active=True, id=self.request.user.pk  # 현재 사용자 프로필만 조회 가능
        )

    def get_object(self):
        """
        현재 요청한 사용자의 프로필 반환

        일반적으로는 URL에서 ID를 추출하지만,
        현재 사용자 프로필의 경우 JWT 토큰에서 사용자 추출

        Returns:
            User: 현재 인증된 사용자 객체
        """
        return self.request.user

    def list(self, request):
        """
        사용자 목록 조회 API (관리자용)

        URL: GET /api/users/

        현재는 인증된 사용자만 접근 가능하며,
        자신의 프로필만 조회 가능하도록 제한되어 있음.
        향후 관리자 기능 추가 시 권한 로직 확장 예정.
        """
        # 현재 정책: 본인 정보만 포함된 리스트 반환
        user_data = UserProfileSerializer(request.user).data
        return Response([user_data])

    @action(detail=False, methods=["get", "put", "patch"])
    def me(self, request):
        """
        현재 사용자 프로필 관리 API

        URL:
        - GET /api/users/me/ : 내 프로필 조회
        - PUT /api/users/me/ : 내 프로필 전체 수정
        - PATCH /api/users/me/ : 내 프로필 부분 수정

        여러 HTTP 메서드를 하나의 함수에서 처리
        """
        user = request.user

        # GET 요청: 프로필 조회
        if request.method == "GET":
            serializer = self.get_serializer(user)
            # get_serializer() 메서드는 어디에서 왔으며, 어떤 역할을 하나?
            # - Django REST Framework의 GenericAPIView에서 제공하는 메서드
            # - 주어진 객체(user)를 직렬화하여 JSON 형태로 변환

            return Response(serializer.data)

        # PUT/PATCH 요청: 프로필 수정
        elif request.method in ["PUT", "PATCH"]:
            # partial=True: PATCH 요청 시 부분 업데이트 허용
            partial = request.method == "PATCH"

            serializer = self.get_serializer(
                user,  # 수정할 사용자 객체
                data=request.data,  # 클라이언트에서 보낸 새로운 데이터
                partial=partial,  # 부분 수정 여부
            )

            # 데이터 유효성 검사
            if serializer.is_valid():
                serializer.save()  # 내부적으로 serializer.update() 호출
                return Response(serializer.data)

            # 검증 실패 시 에러 응답
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

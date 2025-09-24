"""
DRF Serializers for user authentication and profile management.

Serializer의 역할:
1. Python 객체 ↔ JSON 변환 (직렬화/역직렬화)
2. 사용자 입력 데이터 검증 (보안 핵심)
3. 비밀번호 해싱 등 데이터 처리

Guidelines: Security First - 모든 입력값을 검증해야 함
"""

# Django 기본 라이브러리
from django.contrib.auth import authenticate

# DRF (Django REST Framework) 라이브러리
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

# 우리가 만든 User 모델 가져오기
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    회원가입용 Serializer

    ModelSerializer란?
    - Django 모델을 기반으로 자동으로 필드를 생성해주는 Serializer
    - User 모델의 필드들을 자동으로 인식함

    Guidelines: Security First - 모든 입력값 검증
    """

    # 비밀번호 필드: 입력만 받고 응답에는 포함하지 않음 (write_only=True)
    password = serializers.CharField(
        write_only=True,  # JSON 응답에 포함하지 않음 (보안)
        min_length=8,  # 최소 8자리
        style={"input_type": "password"},  # HTML에서 password 타입으로 렌더링
    )

    # 비밀번호 확인 필드: 회원가입 시 비밀번호 재입력용
    password_confirm = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )

    class Meta:
        """
        Meta 클래스: Serializer의 설정을 정의
        """

        model = User  # 어떤 모델을 사용할지 지정

        # 클라이언트에서 받을 필드들 정의
        fields = [
            "email",  # 로그인 ID로 사용
            "username",  # Django 기본 필드 (필수)
            "display_name",  # 화면에 표시될 이름
            "password",  # 비밀번호
            "password_confirm",  # 비밀번호 확인
            "bio",  # 자기소개 (선택)
            "specialization",  # 전문분야 (선택)
            "years_of_experience",  # 경력 (선택)
            "website",  # 웹사이트 (선택)
            "phone_number",  # 전화번호 (선택)
        ]  # 모델의 필드 정의를 자동으로 상속받음 (DRY 원칙 준수)

        # 필수 입력 필드 지정
        extra_kwargs = {
            "email": {"required": True},
            "username": {"required": True},
            "display_name": {"required": True},
        }

    def validate(self, attrs):
        """
        여러 필드를 함께 검증하는 메서드

        Args:
            attrs (dict): 클라이언트에서 보낸 모든 데이터

        Returns:
            dict: 검증된 데이터

        Raises:
            ValidationError: 검증 실패 시 발생
        """
        # 비밀번호와 비밀번호 확인이 일치하는지 검사
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("비밀번호가 일치하지 않습니다.")

        # 검증된 데이터 반환
        return attrs

    # create() 메서드도 자동으로 제공됨 (필요시에만 오버라이드)
    def create(self, validated_data):
        """
        검증된 데이터로 새로운 User 객체 생성

        Args:
            validated_data (dict): validate() 메서드를 통과한 깨끗한 데이터

        Returns:
            User: 생성된 사용자 객체

        Fat Models 원칙: 비즈니스 로직은 모델에서 처리
        """
        # password_confirm은 DB에 저장하지 않으므로 제거
        validated_data.pop("password_confirm")

        # 비밀번호를 별도로 추출 (해싱을 위해)
        password = validated_data.pop("password")

        # Django의 create_user() 메서드 사용
        # 이 메서드는 자동으로 비밀번호를 해싱해줌 (보안)
        user = User.objects.create_user(
            password=password, **validated_data  # 나머지 모든 데이터를 펼쳐서 전달
        )
        return user

    # 만약 Serializer로 회원가입을 구현한다면:

    # class UserRegistrationSerializer(serializers.Serializer):
    # # 모든 필드를 수동으로 정의해야 함 (코드 중복)
    # email = serializers.EmailField(required=True)
    # username = serializers.CharField(max_length=150, required=True)
    # display_name = serializers.CharField(max_length=50, required=True)
    # bio = serializers.CharField(max_length=500, required=False, allow_blank=True)
    # specialization = serializers.CharField(max_length=100, required=False, allow_blank=True)
    # years_of_experience = serializers.IntegerField(required=False, allow_null=True)
    # website = serializers.URLField(required=False, allow_blank=True)
    # phone_number = serializers.CharField(max_length=17, required=False, allow_blank=True)
    # # ... 모델과 동일한 내용을 또 써야 함 (DRY 원칙 위반)

    # def create(self, validated_data):
    #     # 생성 로직도 직접 구현해야 함
    #     return User.objects.create_user(**validated_data)


class UserLoginSerializer(serializers.Serializer):
    """
    로그인용 Serializer

    Serializer (ModelSerializer 아님)를 사용하는 이유:
    - 로그인은 기존 모델을 수정하는 것이 아니라 인증만 하는 것
    - 커스텀 로직이 많이 필요함 (토큰 생성 등)

    Guidelines: Stateless API - JWT 토큰 반환

    기본 Serializer - 모든 필드를 수동으로 정의해야 함

    사용 시점:
    - 모델과 직접적인 관련이 없는 경우 (로그인, 검색 등)
    - 복잡한 커스텀 로직이 필요한 경우
    - 여러 모델의 데이터를 조합해야 하는 경우
    """

    # 로그인 입력 필드들
    # 모든 필드를 수동으로 하나씩 정의해야 함
    email = serializers.EmailField()  # 이메일 형식 자동 검증
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    # 커스텀 로직 구현 (토큰 생성 등)
    def validate(self, attrs):
        """
        로그인 인증 처리

        이 메서드에서 실제 로그인 검증을 수행함
        """
        email = attrs.get("email")
        password = attrs.get("password")

        # 이메일과 비밀번호가 모두 있는지 확인
        if email and password:
            # Django의 authenticate() 함수로 사용자 인증
            # USERNAME_FIELD가 'email'로 설정되어 있지만
            # authenticate() 함수는 항상 'username' 파라미터를 사용함
            user = authenticate(
                request=self.context.get("request"),  # HTTP 요청 객체
                username=email,  # 실제로는 이메일을 전달
                password=password,
            )

            # 인증 실패한 경우
            if not user:
                raise serializers.ValidationError(
                    "이메일 또는 비밀번호가 잘못되었습니다."
                )

            # 계정이 비활성화된 경우
            if not user.is_active:
                raise serializers.ValidationError("비활성화된 계정입니다.")

            # JWT 토큰 생성 (Stateless API 구현)
            refresh = RefreshToken.for_user(user)

            # 검증된 데이터에 사용자 정보와 토큰 추가
            attrs["user"] = user
            attrs["refresh"] = str(refresh)  # 갱신 토큰 (긴 수명)
            attrs["access"] = str(refresh.access_token)  # 접근 토큰 (짧은 수명)

        else:
            raise serializers.ValidationError("이메일과 비밀번호를 모두 입력해주세요.")

        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """
    사용자 프로필 조회/수정용 Serializer

    사용 목적:
    1. 로그인한 사용자의 프로필 정보 조회
    2. 프로필 정보 수정
    3. 다른 사용자의 공개 프로필 조회

    Guidelines: Fat Models - 모델의 메서드를 활용

    ModelSerializer - 모델 기반으로 필드를 자동 생성

    장점:
    1. DRY 원칙: 모델에 정의된 필드를 재사용
    2. 자동 생성: 필드 타입, 제약조건 등을 모델에서 가져옴
    3. 간편함: 적은 코드로 CRUD 구현 가능

    사용 시점:
    - 모델과 1:1 대응되는 API (회원가입, 프로필 수정 등)
    - 표준적인 CRUD 작업
    """

    # 읽기 전용 필드들: 모델의 메서드 결과를 JSON에 포함
    full_display_name = serializers.CharField(
        source="get_full_display_name",  # User 모델의 get_full_display_name() 메서드 호출
        read_only=True,  # 클라이언트에서 수정할 수 없음
    )

    is_experienced_designer = serializers.BooleanField(read_only=True)

    portfolio_url = serializers.CharField(
        source="get_portfolio_url",  # User 모델의 get_portfolio_url() 메서드 호출
        read_only=True,
    )

    class Meta:
        model = User  # 이 모델의 필드들을 자동으로 가져옴

        # 프로필에서 보여줄 필드들
        fields = [
            "id",  # 사용자 고유 번호
            "email",  # 이메일 (수정 불가)
            "username",  # 사용자명 (수정 불가)
            "display_name",  # 표시 이름
            "full_display_name",  # 전체 표시 이름 (계산됨)
            "bio",  # 자기소개
            "specialization",  # 전문분야
            "years_of_experience",  # 경력 년수
            "website",  # 웹사이트
            "phone_number",  # 전화번호
            "profile_image",  # 프로필 이미지
            "is_portfolio_public",  # 포트폴리오 공개 여부
            "is_experienced_designer",  # 경험 많은 디자이너 여부 (계산됨)
            "portfolio_url",  # 포트폴리오 URL (계산됨)
            "date_joined",  # 가입일 (수정 불가)
            "updated_at",  # 최종 수정일 (자동 업데이트)
        ]  # 사용할 필드만 선택

        # 모델의 필드 정의를 자동으로 상속받음:
        # 하지만 모델의 메서드를 직접 상속받지는 않음!

        # email = models.EmailField() → serializers.EmailField() 자동 생성
        # display_name = models.CharField(max_length=50) → serializers.CharField(max_length=50) 자동 생성

        # 클라이언트에서 수정할 수 없는 필드들
        read_only_fields = ["id", "email", "date_joined"]

    def update(self, instance, validated_data):
        """
        사용자 프로필 업데이트

        Args:
            instance (User): 수정할 User 객체
            validated_data (dict): 검증된 새로운 데이터

        Returns:
            User: 수정된 User 객체

        Guidelines: ORM 사용으로 SQL 인젝션 방지
        """
        # 검증된 데이터로 필드들을 하나씩 업데이트
        for attr, value in validated_data.items():
            setattr(instance, attr, value)  # instance.attr = value와 같음

            # items() → dict의 키-값 쌍을 튜플로 반환
            # setattr() → 객체의 속성을 동적으로 설정

            # Python 내장 함수 - 객체의 속성을 동적으로 설정
            # user = User()

            # # 일반적인 방법
            # user.display_name = '김디자이너'

            # # setattr()를 사용한 방법 (동적으로 속성명 지정 가능)
            # setattr(user, 'display_name', '김디자이너')

            # # 반복문에서 유용함
            # for attr, value in validated_data.items():
            #     setattr(user, attr, value)  # user.display_name = '김디자이너' 와 동일

        # DB에 저장 (updated_at 필드가 자동으로 갱신됨)
        instance.save()
        return instance

        # save()
        # Django Model의 메서드 (User 모델이 상속받은 기능)
        # Django가 자동으로 제공하는 메서드들:

        # - save(): 객체를 데이터베이스에 저장
        # - delete(): 객체를 데이터베이스에서 삭제
        # - refresh_from_db(): 데이터베이스에서 최신 데이터로 새로고침

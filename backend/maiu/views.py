"""
Maiu API 뷰
Why: 동영상 업로드 관련 모든 API 엔드포인트 관리
"""

from django.shortcuts import render
from typing import Dict, Any
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.db import models, transaction
import math

from .models import VideoUpload, UploadChunk
from .serializers import (
    VideoUploadSerializer,
    InitiateUploadSerializer,
    ChunkUploadSerializer,
)
from .services.ncp_storage import MaiuNCPStorageService


class MaiuVideoViewSet(viewsets.ModelViewSet):
    """
    Why: Maiu 동영상 업로드 관리 API
    Why: ModelViewSet을 사용하여 CRUD 기본 기능 제공
    """

    serializer_class = VideoUploadSerializer

    def get_permissions(self):
        """
        Why: 액션별 권한 설정 (Security First 원칙)
        """
        if self.action in ["list", "retrieve"]:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Why: 사용자별 및 공개 설정에 따른 필터링
        Why: select_related로 N+1 쿼리 방지
        """
        if self.request.user.is_authenticated:
            # 로그인한 사용자는 자신의 모든 동영상 + 공개 동영상
            return VideoUpload.objects.filter(
                models.Q(uploader=self.request.user) | models.Q(visibility="public")
            ).select_related("uploader")
        else:
            # 비로그인 사용자는 공개 동영상만
            return VideoUpload.objects.filter(visibility="public").select_related(
                "uploader"
            )

    @action(detail=False, methods=["post"])
    def initiate_upload(self, request):
        """
        Why: 동영상 업로드 초기화 - DB 생성 및 Presigned URL 반환
        Why: Security First 원칙에 따라 모든 입력을 검증 후 사용
        """
        serializer = InitiateUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Why: 서비스 레이어를 통한 비즈니스 로직 분리
                storage_service = MaiuNCPStorageService()

                # Why: Type-safe한 접근을 위해 명시적 타입 체크와 할당
                validated_data: Dict[str, Any] = getattr(
                    serializer, "validated_data", {}
                )

                if not validated_data:
                    return Response(
                        {"error": "검증된 데이터가 없습니다."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Why: 필요한 필드들을 개별적으로 추출하여 타입 안전성 확보
                title: str = validated_data.get("title", "")
                description: str = validated_data.get("description", "")
                original_filename: str = validated_data.get("original_filename", "")
                file_size: int = validated_data.get("file_size", 0)
                mime_type: str = validated_data.get("mime_type", "video/mp4")
                visibility: str = validated_data.get("visibility", "private")

                # Why: 필수 필드 검증 (Security First)
                if not all([title, original_filename, file_size > 0, mime_type]):
                    return Response(
                        {"error": "필수 필드가 누락되었습니다."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # 1. 유니크 오브젝트 키 생성
                object_key = storage_service.generate_object_key(
                    request.user.id, original_filename
                )

                # 2. 멀티파트 업로드 초기화
                upload_id = storage_service.initiate_multipart_upload(
                    object_key, mime_type
                )

                # 3. DB에 VideoUpload 레코드 생성
                video_upload = VideoUpload.objects.create(
                    uploader=request.user,
                    title=title,
                    description=description,
                    original_filename=original_filename,
                    file_size=file_size,
                    mime_type=mime_type,
                    object_key=object_key,
                    bucket_name=storage_service.bucket_name,
                    upload_id=upload_id,
                    visibility=visibility,
                    status="pending",
                )

                # 4. 청크 정보 계산 (100MB per chunk)
                chunk_size = 100 * 1024 * 1024  # 100MB
                total_chunks = math.ceil(file_size / chunk_size)

                return Response(
                    {
                        "video_upload_id": str(video_upload.id),
                        "upload_id": upload_id,
                        "object_key": object_key,
                        "chunk_size": chunk_size,
                        "total_chunks": total_chunks,
                        "message": "업로드가 초기화되었습니다.",
                    }
                )

        except Exception as e:
            return Response(
                {"error": f"업로드 초기화 실패: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def get_presigned_urls(self, request, pk=None):
        """
        Why: 청크별 Presigned URL 제공
        Why: 대용량 파일의 멀티파트 업로드 지원
        """
        video_upload = self.get_object()

        # Why: Security First - 업로더만 접근 가능
        if video_upload.uploader != request.user:
            return Response(
                {"error": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN
            )

        try:
            part_numbers = request.data.get("part_numbers", [])
            if not part_numbers:
                return Response(
                    {"error": "part_numbers가 필요합니다."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            storage_service = MaiuNCPStorageService()
            presigned_urls = []

            for part_number in part_numbers:
                url = storage_service.generate_presigned_part_url(
                    video_upload.object_key, video_upload.upload_id, part_number
                )
                presigned_urls.append(
                    {"part_number": part_number, "presigned_url": url}
                )

            return Response({"presigned_urls": presigned_urls})

        except Exception as e:
            return Response(
                {"error": f"URL 생성 실패: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def complete_upload(self, request, pk=None):
        """
        Why: 모든 청크 업로드 완료 후 파일 조합
        Why: 트랜잭션으로 데이터 일관성 보장
        """
        video_upload = self.get_object()

        # Why: Security First - 권한 체크
        if video_upload.uploader != request.user:
            return Response(
                {"error": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = ChunkUploadSerializer(
            data=request.data.get("parts", []), many=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                storage_service = MaiuNCPStorageService()

                # Why: Type-safe한 접근을 위해 명시적 타입 체크와 할당
                validated_data: list = getattr(serializer, "validated_data", [])

                if not validated_data:
                    return Response(
                        {"error": "검증된 데이터가 없습니다."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Parts 정보 구성
                parts = []
                for part in validated_data:
                    part_number = part.get("part_number")
                    etag = part.get("etag")

                    if part_number and etag:
                        parts.append({"PartNumber": part_number, "ETag": etag})

                if not parts:
                    return Response(
                        {"error": "유효한 파트 정보가 없습니다."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # NCP에서 파일 조합 완료
                storage_service.complete_multipart_upload(
                    video_upload.object_key, video_upload.upload_id, parts
                )

                # DB 상태 업데이트
                video_upload.status = "completed"
                video_upload.upload_progress = 100.0
                video_upload.completed_at = timezone.now()
                video_upload.save()

                return Response(
                    {
                        "message": "업로드가 완료되었습니다.",
                        "video_upload": VideoUploadSerializer(video_upload).data,
                    }
                )

        except Exception as e:
            # Why: 실패 시 명시적으로 상태 업데이트
            video_upload.status = "failed"
            video_upload.save()

            return Response(
                {"error": f"업로드 완료 실패: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

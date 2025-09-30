"""
Maiu 동영상 업로드 서비스
Why: 포트폴리오와 완전히 분리된 독립적인 동영상 업로드 기능
Why: settings.AUTH_USER_MODEL을 사용하여 커스텀 User 모델과 연결
"""

from django.db import models
from django.conf import settings  # Why: settings.AUTH_USER_MODEL 사용을 위해 import
from django.core.validators import FileExtensionValidator
import uuid


class VideoUpload(models.Model):
    """
    Why: 동영상 업로드 메타데이터 관리
    Why: 실제 파일은 NCP Storage에, 메타정보는 DB에 저장
    Why: settings.AUTH_USER_MODEL을 사용하여 커스텀 User 모델과 안전하게 연결
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("uploading", "Uploading"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    VISIBILITY_CHOICES = [
        ("public", "Public"),
        ("private", "Private"),
        ("unlisted", "Unlisted"),
    ]

    # 기본 정보
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Why: settings.AUTH_USER_MODEL 사용으로 커스텀 User 모델과 연결
    uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="maiu_uploads"
    )

    # 파일 메타데이터
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()  # bytes
    mime_type = models.CharField(max_length=100)
    duration = models.FloatField(null=True, blank=True)  # seconds

    # NCP Storage 정보
    object_key = models.CharField(max_length=500, unique=True)
    bucket_name = models.CharField(max_length=100)

    # 업로드 상태 관리
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    upload_progress = models.FloatField(default=0.0)  # 0-100
    upload_id = models.CharField(max_length=100, blank=True)  # NCP multipart upload ID

    # 공개 설정
    visibility = models.CharField(
        max_length=20, choices=VISIBILITY_CHOICES, default="private"
    )

    # 통계
    view_count = models.PositiveIntegerField(default=0)

    # 타임스탬프
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "maiu_video_uploads"
        indexes = [
            models.Index(fields=["uploader", "-created_at"]),
            models.Index(fields=["status"]),
            models.Index(fields=["visibility", "-created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} by {self.uploader.username}"


class UploadChunk(models.Model):
    """
    Why: 멀티파트 업로드의 각 청크 추적
    Why: 업로드 실패 시 재시도 및 진행률 관리
    """

    video_upload = models.ForeignKey(
        VideoUpload, on_delete=models.CASCADE, related_name="chunks"
    )
    part_number = models.PositiveIntegerField()
    etag = models.CharField(max_length=100, blank=True)
    size = models.BigIntegerField()
    is_uploaded = models.BooleanField(default=False)

    class Meta:
        db_table = "maiu_upload_chunks"
        unique_together = ["video_upload", "part_number"]
        ordering = ["part_number"]

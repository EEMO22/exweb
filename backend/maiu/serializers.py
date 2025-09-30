"""
Maiu API 시리얼라이저
"""

from rest_framework import serializers
from .models import VideoUpload, UploadChunk


class InitiateUploadSerializer(serializers.Serializer):
    """
    Why: 업로드 초기화 요청 검증
    """

    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    original_filename = serializers.CharField(max_length=255)
    file_size = serializers.IntegerField(
        min_value=1, max_value=10 * 1024 * 1024 * 1024
    )  # 10GB 제한
    mime_type = serializers.CharField(max_length=100)
    visibility = serializers.ChoiceField(
        choices=VideoUpload.VISIBILITY_CHOICES, default="private"
    )

    def validate_mime_type(self, value):
        """
        Why: 동영상 파일만 허용
        """
        allowed_types = [
            "video/mp4",
            "video/mov",
            "video/webm",
            "video/mkv",
        ]
        if value not in allowed_types:
            raise serializers.ValidationError(
                f"지원되지 않는 파일 형식입니다. 허용 형식: {', '.join(allowed_types)}"
            )
        return value


class VideoUploadSerializer(serializers.ModelSerializer):
    """
    Why: VideoUpload 모델 시리얼라이저
    """

    uploader_username = serializers.CharField(
        source="uploader.username", read_only=True
    )

    class Meta:
        model = VideoUpload
        fields = [
            "id",
            "title",
            "description",
            "original_filename",
            "file_size",
            "status",
            "upload_progress",
            "visibility",
            "view_count",
            "created_at",
            "uploader_username",
        ]
        read_only_fields = ["id", "created_at", "uploader_username", "view_count"]


class ChunkUploadSerializer(serializers.Serializer):
    """
    Why: 청크 업로드 정보 검증
    """

    part_number = serializers.IntegerField(min_value=1, max_value=10000)
    etag = serializers.CharField(max_length=100)

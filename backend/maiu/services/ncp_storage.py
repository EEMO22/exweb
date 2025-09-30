"""
NCP Object Storage 서비스
Why: 대용량 동영상 업로드를 위한 멀티파트 업로드 관리
"""

import boto3
import uuid
import os
from datetime import datetime
from django.conf import settings
from typing import Dict, Any, List


class MaiuNCPStorageService:
    """
    Why: Maiu 전용 NCP Storage 서비스 (포트폴리오와 분리)
    """

    def __init__(self):
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.NCP_OBJECT_STORAGE_ENDPOINT,
            aws_access_key_id=settings.NCP_ACCESS_KEY_ID,
            aws_secret_access_key=settings.NCP_SECRET_ACCESS_KEY,
            region_name=settings.NCP_REGION,
        )
        self.bucket_name = settings.NCP_BUCKET_NAME

    def generate_object_key(self, user_id: int, original_filename: str) -> str:
        """
        Why: maiu 전용 파일 경로 생성
        """
        file_ext = os.path.splitext(original_filename)[1].lower()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = uuid.uuid4().hex[:12]

        return f"maiu/videos/{user_id}/{timestamp}_{unique_id}{file_ext}"

    def initiate_multipart_upload(self, object_key: str, content_type: str) -> str:
        """
        Why: 대용량 파일을 위한 멀티파트 업로드 초기화
        """
        try:
            response = self.client.create_multipart_upload(
                Bucket=self.bucket_name,
                Key=object_key,
                ContentType=content_type,
                Metadata={"service": "maiu", "uploaded_at": datetime.now().isoformat()},
            )
            return response["UploadId"]
        except Exception as e:
            raise Exception(f"멀티파트 업로드 초기화 실패: {str(e)}")

    def generate_presigned_part_url(
        self, object_key: str, upload_id: str, part_number: int, expires_in: int = 3600
    ) -> str:
        """
        Why: 각 청크별 업로드 URL 생성
        """
        try:
            return self.client.generate_presigned_url(
                "upload_part",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": object_key,
                    "PartNumber": part_number,
                    "UploadId": upload_id,
                },
                ExpiresIn=expires_in,
            )
        except Exception as e:
            raise Exception(f"파트 URL 생성 실패: {str(e)}")

    def complete_multipart_upload(
        self, object_key: str, upload_id: str, parts: List[Dict]
    ) -> Dict[str, Any]:
        """
        Why: 모든 청크 업로드 완료 후 파일 조합
        """
        try:
            return self.client.complete_multipart_upload(
                Bucket=self.bucket_name,
                Key=object_key,
                UploadId=upload_id,
                MultipartUpload={"Parts": parts},
            )
        except Exception as e:
            raise Exception(f"업로드 완료 처리 실패: {str(e)}")

    def abort_multipart_upload(self, object_key: str, upload_id: str) -> None:
        """
        Why: 실패한 업로드 정리
        """
        try:
            self.client.abort_multipart_upload(
                Bucket=self.bucket_name, Key=object_key, UploadId=upload_id
            )
        except Exception as e:
            # Why: 정리 실패는 로그만 남기고 진행
            print(f"업로드 정리 실패: {str(e)}")

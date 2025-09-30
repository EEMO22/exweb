/**
 * Maiu 동영상 업로드 API 서비스
 * Why: Separation of Concerns - API 로직을 컴포넌트에서 분리
 */

import { apiClient } from './index';

export interface VideoUploadData {
  title: string;
  description: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  visibility: 'public' | 'private' | 'unlisted';
}

export interface InitiateUploadResponse {
  video_upload_id: string;
  upload_id: string;
  object_key: string;
  chunk_size: number;
  total_chunks: number;
  message: string;
}

export interface PresignedUrlResponse {
  presigned_urls: Array<{
    part_number: number;
    presigned_url: string;
  }>;
}

export interface VideoUpload {
  id: string;
  title: string;
  original_filename: string;
  file_size: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  upload_progress: number;
  visibility: 'public' | 'private' | 'unlisted';
  created_at: string;
  uploader_username: string;
}

/**
 * Maiu API 함수들
 */
export const maiuAPI = {
  /**
   * 업로드 초기화
   * Why: Backend에서 멀티파트 업로드 ID와 메타데이터 생성
   */
  async initiateUpload(data: VideoUploadData): Promise<InitiateUploadResponse> {
    try {
      const response = await apiClient.post(
        '/maiu/videos/initiate_upload/',
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(`업로드 초기화 실패: ${error}`);
    }
  },

  /**
   * Presigned URL 요청
   */
  async getPresignedUrls(
    videoUploadId: string,
    partNumbers: number[]
  ): Promise<PresignedUrlResponse> {
    try {
      const response = await apiClient.post(
        `/maiu/videos/${videoUploadId}/get_presigned_urls/`,
        { part_numbers: partNumbers }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Presigned URL 요청 실패: ${error}`);
    }
  },

  /**
   * 업로드 완료 알림
   * Why: 모든 청크 업로드 완료 후 Backend에 알림
   */
  async completeUpload(
    videoUploadId: string,
    parts: Array<{ part_number: number; etag: string }>
  ): Promise<{ message: string; video_upload: VideoUpload }> {
    try {
      const response = await apiClient.post(
        `/maiu/videos/${videoUploadId}/complete_upload/`,
        { parts }
      );
      return response.data;
    } catch (error) {
      throw new Error(`업로드 완료 실패: ${error}`);
    }
  },

  /**
   * 업로드 목록 조회
   * Why: 사용자의 업로드된 동영상 목록 표시
   */
  async getUploads(): Promise<VideoUpload[]> {
    try {
      const response = await apiClient.get('/maiu/videos/');
      return response.data.results || response.data;
    } catch (error) {
      throw new Error(`업로드 목록 조회 실패: ${error}`);
    }
  },
};

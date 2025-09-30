/**
 * Maiu 동영상 업로드 상태 관리
 */

import { create } from 'zustand';
import { maiuAPI, VideoUpload, VideoUploadData } from '../services/api/maiu';

interface UploadProgress {
  uploadId: string;
  progress: number;
  currentChunk: number;
  totalChunks: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}

interface MaiuState {
  // State
  uploads: VideoUpload[];
  currentUploads: Record<string, UploadProgress>;
  isUploading: boolean;
  error: string | null;

  // Actions
  fetchUploads: () => Promise<void>;
  initiateUpload: (
    uploadData: VideoUploadData & { file: File }
  ) => Promise<void>;
  updateProgress: (uploadId: string, progress: Partial<UploadProgress>) => void;
  clearError: () => void;

  // Private methods
  uploadFileInChunks: (
    file: File,
    videoUploadId: string,
    uploadId: string,
    chunkSize: number,
    totalChunks: number
  ) => Promise<void>;
}

export const useMaiuStore = create<MaiuState>((set, get) => ({
  // Initial State
  uploads: [],
  currentUploads: {},
  isUploading: false,
  error: null,

  /**
   * 업로드 목록 조회
   * Why: 사용자의 동영상 목록을 표시하기 위해
   */
  fetchUploads: async () => {
    try {
      const uploads = await maiuAPI.getUploads();
      set({ uploads });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '업로드 목록을 불러오지 못했습니다.';
      set({ error: errorMessage });
    }
  },

  /**
   * 업로드 시작
   * Why: 파일 선택 후 업로드 프로세스 초기화
   */
  initiateUpload: async uploadData => {
    set({ isUploading: true, error: null });

    try {
      // 1. 업로드 초기화 - Backend에서 메타데이터 생성
      const initResponse = await maiuAPI.initiateUpload({
        title: uploadData.title,
        description: uploadData.description,
        original_filename: uploadData.file.name,
        file_size: uploadData.file.size,
        mime_type: uploadData.file.type,
        visibility: uploadData.visibility,
      });

      const { video_upload_id, upload_id, chunk_size, total_chunks } =
        initResponse;

      // 2. 진행률 추적 시작
      set(state => ({
        currentUploads: {
          ...state.currentUploads,
          [video_upload_id]: {
            uploadId: upload_id,
            progress: 0,
            currentChunk: 0,
            totalChunks: total_chunks,
            status: 'uploading',
          },
        },
      }));

      // 3. 파일을 청크로 분할하여 업로드
      await get().uploadFileInChunks(
        uploadData.file,
        video_upload_id,
        upload_id,
        chunk_size,
        total_chunks
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '업로드에 실패했습니다.';
      set({
        error: errorMessage,
        isUploading: false,
      });
    }
  },

  /**
   * 청크별 파일 업로드
   * Why: 대용량 파일(10GB)을 안전하게 업로드하기 위한 멀티파트 업로드
   */
  uploadFileInChunks: async (
    file,
    videoUploadId,
    uploadId,
    chunkSize,
    totalChunks
  ) => {
    const chunks: Array<{ part_number: number; etag: string }> = [];

    try {
      for (let i = 0; i < totalChunks; i++) {
        const partNumber = i + 1;
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        // Presigned URL 요청
        const urlResponse = await maiuAPI.getPresignedUrls(videoUploadId, [
          partNumber,
        ]);
        const presignedUrl = urlResponse.presigned_urls[0].presigned_url;

        // 청크를 NCP Storage로 직접 업로드
        const uploadResponse = await fetch(presignedUrl, {
          method: 'PUT',
          body: chunk,
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`청크 ${partNumber} 업로드 실패`);
        }

        // ETag 추출 (NCP에서 반환하는 파일 해시)
        const etag =
          uploadResponse.headers.get('ETag')?.replace(/"/g, '') || '';
        chunks.push({ part_number: partNumber, etag });

        // 진행률 업데이트
        const progress = Math.round(((i + 1) / totalChunks) * 100);
        get().updateProgress(videoUploadId, {
          progress,
          currentChunk: partNumber,
        });
      }

      // 업로드 완료 알림
      get().updateProgress(videoUploadId, { status: 'processing' });
      await maiuAPI.completeUpload(videoUploadId, chunks);

      // 상태 정리
      set(state => {
        const newCurrentUploads = { ...state.currentUploads };
        delete newCurrentUploads[videoUploadId];

        return {
          currentUploads: newCurrentUploads,
          isUploading: false,
        };
      });

      // 업로드 목록 새로고침
      await get().fetchUploads();
    } catch (error) {
      get().updateProgress(videoUploadId, { status: 'failed' });
      throw error;
    }
  },

  /**
   * 업로드 진행률 업데이트
   * Why: UI에서 실시간으로 업로드 상태를 표시하기 위해
   */
  updateProgress: (uploadId, progress) => {
    set(state => ({
      currentUploads: {
        ...state.currentUploads,
        [uploadId]: {
          ...state.currentUploads[uploadId],
          ...progress,
        },
      },
    }));
  },

  /**
   * 에러 초기화
   * Why: 사용자가 에러 메시지를 확인한 후 상태 정리
   */
  clearError: () => {
    set({ error: null });
  },
}));

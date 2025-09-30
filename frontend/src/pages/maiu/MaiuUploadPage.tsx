/**
 * Maiu 동영상 업로드 페이지
 * Why: 간단한 UI로 동영상 업로드 기능만 제공
 * Why: TypeScript 타입 안전성을 위한 명시적 타입 정의
 */

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useMaiuStore } from '../../store/maiuStore';

// Why: 컴포넌트 내부에서 사용할 폼 데이터 타입 정의
type FormVisibility = 'public' | 'private' | 'unlisted';

interface FormData {
  title: string;
  description: string;
  visibility: FormVisibility;
  file: File | null;
}

const MaiuUploadPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const {
    uploads,
    currentUploads,
    isUploading,
    error,
    initiateUpload,
    fetchUploads,
    clearError,
  } = useMaiuStore();

  // Why: 명시적 타입으로 상태 정의
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    visibility: 'private',
    file: null,
  });

  /**
   * 컴포넌트 마운트 시 업로드 목록 조회
   * Why: 사용자의 기존 업로드 목록을 표시하기 위해
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchUploads();
    }
  }, [isAuthenticated, fetchUploads]);

  /**
   * 파일 선택 핸들러
   * Why: 동영상 파일만 허용하고 10GB 제한 적용
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (10GB 제한)
      const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
      if (file.size > maxSize) {
        alert('파일 크기는 10GB를 초과할 수 없습니다.');
        return;
      }

      // 동영상 파일 형식 검증
      if (!file.type.startsWith('video/')) {
        alert('동영상 파일만 업로드할 수 있습니다.');
        return;
      }

      setFormData(prev => ({ ...prev, file }));
    }
  };

  /**
   * 업로드 시작 핸들러
   * Why: 폼 검증 후 업로드 프로세스 시작
   * Why: 타입 안전성을 위해 필요한 필드들을 명시적으로 전달
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.file) {
      alert('동영상 파일을 선택해주세요.');
      return;
    }

    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    try {
      // Why: VideoUploadData 타입에 맞게 데이터 구성
      await initiateUpload({
        title: formData.title,
        description: formData.description,
        original_filename: formData.file.name, // 추가된 필드
        file_size: formData.file.size, // 추가된 필드
        mime_type: formData.file.type, // 추가된 필드
        visibility: formData.visibility,
        file: formData.file,
      });

      // 성공 시 폼 초기화
      setFormData({
        title: '',
        description: '',
        visibility: 'private',
        file: null,
      });

      // 파일 input 초기화
      const fileInput = document.getElementById(
        'video-file'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  /**
   * 파일 크기를 읽기 쉬운 형태로 변환
   * Why: 사용자가 파일 크기를 쉽게 확인할 수 있도록
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 로그인하지 않은 사용자 처리
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            로그인이 필요합니다
          </h2>
          <p className="text-gray-600">동영상을 업로드하려면 로그인해주세요.</p>
          <a
            href="/login"
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            로그인하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Maiu - 동영상 업로드
        </h1>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex justify-between items-center">
              <p className="text-red-800">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 업로드 폼 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              새 동영상 업로드
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="동영상 제목을 입력하세요"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="동영상에 대한 설명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  공개 설정
                </label>
                <select
                  value={formData.visibility}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      visibility: e.target.value as FormVisibility, // Why: 명시적 타입 캐스팅
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">비공개</option>
                  <option value="public">공개</option>
                  <option value="unlisted">링크로만 공유</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  동영상 파일 * (최대 10GB)
                </label>
                <input
                  id="video-file"
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {formData.file && (
                  <p className="mt-2 text-sm text-gray-600">
                    선택된 파일: {formData.file.name} (
                    {formatFileSize(formData.file.size)})
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? '업로드 중...' : '업로드 시작'}
              </button>
            </form>
          </div>

          {/* 업로드 진행률 및 목록 */}
          <div className="space-y-6">
            {/* 현재 업로드 진행률 */}
            {Object.keys(currentUploads).length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  업로드 진행률
                </h3>
                {Object.entries(currentUploads).map(([uploadId, progress]) => (
                  <div key={uploadId} className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>
                        청크 {progress.currentChunk}/{progress.totalChunks}
                      </span>
                      <span>{progress.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      상태:{' '}
                      {progress.status === 'uploading'
                        ? '업로드 중'
                        : progress.status === 'processing'
                          ? '처리 중'
                          : progress.status === 'completed'
                            ? '완료'
                            : '실패'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 업로드된 동영상 목록 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                내 동영상
              </h3>
              {uploads.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  업로드된 동영상이 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {uploads.map(upload => (
                    <div
                      key={upload.id}
                      className="border border-gray-200 rounded-md p-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {upload.title}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(upload.file_size)} •{' '}
                            {upload.visibility}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(upload.created_at).toLocaleDateString(
                              'ko-KR'
                            )}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            upload.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : upload.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {upload.status === 'completed'
                            ? '완료'
                            : upload.status === 'failed'
                              ? '실패'
                              : upload.status === 'uploading'
                                ? '업로드 중'
                                : upload.status === 'processing'
                                  ? '처리 중'
                                  : '대기'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaiuUploadPage;

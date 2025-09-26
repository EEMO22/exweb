/**
 * 사용자 프로필 관련 API 함수들
 */

import type { AxiosError } from 'axios';
import type { User } from '../../types';
import { apiClient, handleApiError } from './index';

/**
 * 사용자 API 객체
 */
export const userAPI = {
  /**
   * 내 프로필 조회
   */
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/users/me/');
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },

  /**
   * 프로필 수정
   * @param profileData 수정할 프로필 데이터
   */
  async updateProfile(profileData: Partial<User>): Promise<User> {
    // Partial<User>를 사용하여 일부 필드만 업데이트 가능
    try {
      const response = await apiClient.patch<User>('/users/me/', profileData);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },

  /**
   * 프로필 이미지 업로드
   * @param imageFile 업로드할 이미지 파일
   */
  async uploadProfileImage(imageFile: File): Promise<User> {
    try {
      const formData = new FormData();
      formData.append('profile_image', imageFile);

      const response = await apiClient.patch<User>('/user/me/', formData, {
        headers: {
          'Content-type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },

  /**
   * 다른 사용자 프로필 조회 (공개 정보만)
   * @param userId 조회할 사용자 ID
   */
  async getUserProfile(userId: number): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/users/${userId}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
};

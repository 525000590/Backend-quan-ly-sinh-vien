import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SinhVien {
  maSV: string;
  hoTen: string;
  email: string;
  maLop: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

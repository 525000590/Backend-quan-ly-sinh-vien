import React, { useState } from 'react';
import axios from 'axios';
import { apiClient, type ApiResponse, type UserProfile } from '../api/client';

interface LoginProps {
  token: string | null;
  profile: UserProfile | null;
  onLoginSuccess: (token: string) => void;
  onLogout: () => void;
}

export const Login: React.FC<LoginProps> = ({
  token,
  profile,
  onLoginSuccess,
  onLogout,
}) => {
  const [email, setEmail] = useState<string>('admin@example.com');
  const [password, setPassword] = useState<string>('Admin@123');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await apiClient.post<
        ApiResponse<{ accessToken: string; tokenType: string; expiresIn: number }>
      >('/api/auth/login', {
        email,
        password,
      });

      if (res.data?.success && res.data.data?.accessToken) {
        onLoginSuccess(res.data.data.accessToken);
      } else {
        setErrorMsg('Không nhận được token xác thực từ máy chủ.');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setErrorMsg('Email hoặc mật khẩu không chính xác (401 Unauthorized).');
        } else if (err.response?.data?.message) {
          setErrorMsg(err.response.data.message);
        } else {
          setErrorMsg('Lỗi kết nối máy chủ hoặc chính sách CORS.');
        }
      } else {
        setErrorMsg('Đã xảy ra lỗi không xác định.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (token && profile) {
    return (
      <div className="card user-profile-card">
        <div className="profile-badge-row">
          <span className={`role-badge role-${profile.role}`}>
            {profile.role.toUpperCase()}
          </span>
          <button className="btn btn-outline-danger btn-sm" onClick={onLogout}>
            Đăng xuất
          </button>
        </div>
        <div className="profile-info">
          <h3>{profile.fullName}</h3>
          <p className="profile-email">✉️ {profile.email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card login-card">
      <div className="card-header">
        <h2>🔐 Đăng Nhập</h2>
      </div>

      {errorMsg && <div className="alert alert-error">⚠️ {errorMsg}</div>}

      <form onSubmit={handleSubmit} className="form-vertical">
        <div className="form-group">
          <label htmlFor="login-email">Email:</label>
          <input
            id="login-email"
            type="email"
            className="input-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nhap.email@example.com"
            required
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Mật khẩu:</label>
          <input
            id="login-password"
            type="password"
            className="input-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            required
            disabled={submitting}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Đang xác thực...' : 'Đăng Nhập'}
        </button>

        <div className="quick-fill-hint">
          <small>Gợi ý tài khoản kiểm thử:</small>
          <div className="button-group-sm">
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setEmail('admin@example.com');
                setPassword('Admin@123');
              }}
            >
              Admin (Toàn quyền)
            </button>
            <span>•</span>
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setEmail('student.test@example.com');
                setPassword('Student@123');
              }}
            >
              Student (Chỉ đọc)
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

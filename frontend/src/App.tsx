import { useState, useCallback, useEffect } from 'react';
import { apiClient, API_BASE_URL, type ApiResponse, type UserProfile } from './api/client';
import { Login } from './components/Login';
import { SinhVienTable } from './components/SinhVienTable';
import { AvatarUpload } from './components/AvatarUpload';
import './App.css';

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Kiểm tra trạng thái kết nối Backend
  const checkServer = useCallback(async () => {
    try {
      const res = await apiClient.get<{ success: boolean; message: string }>('/health');
      if (res.status === 200) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkServer();
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, [checkServer]);

  // Lấy thông tin Profile của tài khoản đang đăng nhập
  const fetchProfile = useCallback(async (authToken: string) => {
    try {
      const res = await apiClient.get<ApiResponse<UserProfile>>('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.data?.success && res.data.data) {
        setProfile(res.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token không hợp lệ hoặc hết hạn
        setToken(null);
        setProfile(null);
      }
    }
  }, []);

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
    fetchProfile(newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setProfile(null);
  };

  const handleAvatarUpdated = () => {
    if (token) {
      fetchProfile(token);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-logo">🎓</span>
          <div>
            <h1>Hệ Thống Quản Lý Sinh Viên</h1>
            <p className="header-sub">Chương 07: Upload Avatar & Kết Nối Frontend - Backend</p>
          </div>
        </div>

        <div className="header-meta">
          <div className={`status-indicator status-${serverStatus}`}>
            <span className="status-dot"></span>
            <span>
              Backend: {serverStatus === 'online' ? 'Hoạt động (200)' : serverStatus === 'checking' ? 'Đang kiểm tra...' : 'Ngoại tuyến (Offline)'}
            </span>
          </div>
          <span className="api-url-tag">API: {API_BASE_URL}</span>
        </div>
      </header>

      <main className="app-main">
        <aside className="app-sidebar">
          <Login
            token={token}
            profile={profile}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />

          {token && profile && (
            <AvatarUpload
              token={token}
              profile={profile}
              onAvatarUpdated={handleAvatarUpdated}
            />
          )}
        </aside>

        <section className="app-content">
          <SinhVienTable token={token} profile={profile} />
        </section>
      </main>

      <footer className="app-footer">
        <p>Hệ thống Quản lý Sinh viên • Thực hành Chương 07 • Node.js + Express + SQL Server + Vite React</p>
      </footer>
    </div>
  );
}

export default App;

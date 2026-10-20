import React, { useState, useRef } from 'react';
import axios from 'axios';
import { apiClient, API_BASE_URL, type ApiResponse, type UserProfile } from '../api/client';

interface AvatarUploadProps {
  token: string | null;
  profile: UserProfile | null;
  onAvatarUpdated: () => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  token,
  profile,
  onAvatarUpdated,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatusMsg(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // 1. Kiểm tra kích thước file tối đa 2MB (2 * 1024 * 1024 bytes) tại Frontend
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setStatusMsg({
        type: 'error',
        text: 'Dung lượng file vượt quá giới hạn 2MB (2.097.152 bytes). Vui lòng chọn ảnh nhỏ hơn.',
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Kiểm tra định dạng cơ bản
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setStatusMsg({
        type: 'error',
        text: 'Định dạng file không hỗ trợ. Chỉ chấp nhận ảnh JPEG hoặc PNG (.jpg, .jpeg, .png).',
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatusMsg({ type: 'error', text: 'Vui lòng chọn file ảnh đại diện trước khi nhấn tải lên.' });
      return;
    }

    if (!token) {
      setStatusMsg({ type: 'error', text: 'Bạn cần đăng nhập để thực hiện tải ảnh đại diện.' });
      return;
    }

    setUploading(true);
    setStatusMsg(null);

    try {
      const formData = new FormData();
      // Form field bắt buộc phải tên là 'avatar' theo hợp đồng
      formData.append('avatar', selectedFile);

      // Không tự đặt Content-Type multipart/form-data để trình duyệt tự động đính kèm boundary
      const res = await apiClient.post<ApiResponse<{ avatarUrl: string }>>(
        '/api/auth/me/avatar',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status === 200 && res.data.success) {
        setStatusMsg({
          type: 'success',
          text: 'Tải lên và cập nhật ảnh đại diện thành công!',
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Làm mới thông tin hồ sơ để hiển thị ảnh mới từ CSDL
        onAvatarUpdated();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const msg = err.response?.data?.message;

        if (status === 413) {
          setStatusMsg({
            type: 'error',
            text: 'Dung lượng ảnh vượt quá giới hạn 2MB của máy chủ (413 Payload Too Large).',
          });
        } else if (status === 400) {
          setStatusMsg({
            type: 'error',
            text: msg || 'Ảnh không hợp lệ hoặc sai chữ ký file (400 Bad Request).',
          });
        } else if (status === 401) {
          setStatusMsg({
            type: 'error',
            text: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
          });
        } else {
          setStatusMsg({
            type: 'error',
            text: msg || 'Không thể tải ảnh đại diện lên máy chủ.',
          });
        }
      } else {
        setStatusMsg({
          type: 'error',
          text: 'Đã xảy ra lỗi không xác định khi tải ảnh lên.',
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const currentAvatarSrc = profile?.avatarUrl
    ? `${API_BASE_URL}${profile.avatarUrl}`
    : null;

  return (
    <div className="card avatar-upload-card">
      <div className="card-header">
        <h2>🖼️ Ảnh Đại Diện (Avatar)</h2>
      </div>

      {statusMsg && (
        <div className={`alert alert-${statusMsg.type}`}>
          {statusMsg.type === 'success' ? '✓' : '⚠️'} {statusMsg.text}
        </div>
      )}

      <div className="avatar-display-section">
        <div className="avatar-frame">
          {previewUrl ? (
            <img src={previewUrl} alt="Xem trước ảnh tải lên" className="avatar-img preview" />
          ) : currentAvatarSrc ? (
            <img src={currentAvatarSrc} alt="Ảnh đại diện hiện tại" className="avatar-img" />
          ) : (
            <div className="avatar-placeholder">
              <span>{profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : '👤'}</span>
            </div>
          )}
        </div>
        <div className="avatar-meta">
          <p className="avatar-status-label">
            {currentAvatarSrc ? 'Ảnh đại diện đang lưu trên máy chủ' : 'Chưa có ảnh đại diện'}
          </p>
          {profile?.avatarUrl && (
            <code className="avatar-path-code">{profile.avatarUrl}</code>
          )}
        </div>
      </div>

      <div className="upload-controls">
        <input
          ref={fileInputRef}
          type="file"
          id="avatar-file-input"
          accept="image/png,image/jpeg"
          onChange={handleFileChange}
          disabled={uploading}
          className="file-input"
        />

        <div className="upload-button-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Đang tải lên máy chủ...' : '⬆️ Cập Nhật Avatar'}
          </button>
          {selectedFile && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={uploading}
            >
              Hủy chọn
            </button>
          )}
        </div>
        <small className="file-help-text">
          Chấp nhận: JPEG, PNG • Dung lượng tối đa: 2MB (2.097.152 bytes)
        </small>
      </div>
    </div>
  );
};

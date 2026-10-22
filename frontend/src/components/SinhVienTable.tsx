import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  apiClient,
  type SinhVien,
  type ApiResponse,
  type UserProfile,
  type PaginationMeta,
} from '../api/client';

interface SinhVienTableProps {
  token: string | null;
  profile: UserProfile | null;
}

export const SinhVienTable: React.FC<SinhVienTableProps> = ({ token, profile }) => {
  const [sinhViens, setSinhViens] = useState<SinhVien[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(5);
  const [search, setSearch] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 5,
    totalItems: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingMaSV, setDeletingMaSV] = useState<string | null>(null);

  const fetchSinhViens = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ApiResponse<SinhVien[]>>('/api/v1/sinh-vien', {
        params: {
          page,
          limit,
          search: search.trim() ? search.trim() : undefined,
        },
      });

      // Đọc mảng chính xác tại response.data.data và metadata tại response.data.pagination
      if (response.data && Array.isArray(response.data.data)) {
        setSinhViens(response.data.data);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setError('Phản hồi từ máy chủ không đúng định dạng mảng dữ liệu.');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError('Không thể kết nối đến máy chủ Backend (Network / ERR_CONNECTION_REFUSED).');
        } else {
          setError(`Lỗi tải dữ liệu: ${err.response.data?.message || err.message}`);
        }
      } else {
        setError('Đã xảy ra lỗi không xác định khi tải danh sách.');
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchSinhViens();
  }, [fetchSinhViens]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Quy tắc: khi đổi từ khóa tìm kiếm, luôn quay về trang 1
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (page < pagination.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const handleDelete = async (maSV: string) => {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa sinh viên có mã "${maSV}" không?`);
    if (!confirmDelete) return;

    setActionMessage(null);
    setDeletingMaSV(maSV);

    try {
      const response = await apiClient.delete<ApiResponse<null>>(`/api/v1/sinh-vien/${maSV}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setActionMessage({
          type: 'success',
          text: `Đã xóa thành công sinh viên mã "${maSV}".`,
        });
        // Tải lại danh sách từ server để đảm bảo tính nhất quán
        await fetchSinhViens();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const msg = err.response?.data?.message;

        if (status === 401) {
          setActionMessage({
            type: 'error',
            text: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
          });
        } else if (status === 403) {
          setActionMessage({
            type: 'error',
            text: 'Bạn không có quyền thực hiện thao tác này (Chỉ Quản trị viên mới được xóa).',
          });
        } else if (status === 404) {
          setActionMessage({
            type: 'error',
            text: `Không tìm thấy sinh viên mã "${maSV}" trong hệ thống.`,
          });
        } else {
          setActionMessage({
            type: 'error',
            text: msg || `Xóa thất bại với mã lỗi HTTP ${status}.`,
          });
        }
      } else {
        setActionMessage({
          type: 'error',
          text: 'Lỗi không xác định khi xóa sinh viên.',
        });
      }
    } finally {
      setDeletingMaSV(null);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="card">
      <div className="card-header">
        <h2>📋 Danh Sách Sinh Viên</h2>
        <button className="btn btn-secondary btn-sm" onClick={fetchSinhViens} disabled={loading}>
          {loading ? 'Đang tải...' : '🔄 Làm mới'}
        </button>
      </div>

      {/* Thanh công cụ tìm kiếm và thông tin tổng số */}
      <div className="table-toolbar">
        <div className="search-box">
          <input
            type="text"
            className="input-control"
            placeholder="🔍 Tìm kiếm theo họ tên (hoTen)..."
            value={search}
            onChange={handleSearchChange}
          />
          {search && (
            <button
              className="btn btn-link btn-clear-search"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
            >
              ✕
            </button>
          )}
        </div>
        <div className="total-badge">
          Tổng số: <strong>{pagination.totalItems}</strong> sinh viên
        </div>
      </div>

      {actionMessage && (
        <div className={`alert alert-${actionMessage.type}`}>
          {actionMessage.type === 'success' ? '✓' : '⚠️'} {actionMessage.text}
        </div>
      )}

      {loading && (
        <div className="state-box">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu phân trang từ SQL Server...</p>
        </div>
      )}

      {error && !loading && (
        <div className="state-box error-box">
          <p className="error-text">❌ {error}</p>
          <button className="btn btn-primary" onClick={fetchSinhViens}>
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && sinhViens.length === 0 && (
        <div className="state-box">
          <p className="empty-text">
            {search ? `Không tìm thấy sinh viên nào phù hợp với từ khóa "${search}".` : 'Hiện tại danh sách sinh viên đang trống.'}
          </p>
        </div>
      )}

      {!loading && !error && sinhViens.length > 0 && (
        <>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã SV</th>
                  <th>Họ và Tên</th>
                  <th>Email</th>
                  <th>Mã Lớp</th>
                  {isAdmin && <th>Thao tác (Admin)</th>}
                </tr>
              </thead>
              <tbody>
                {sinhViens.map((sv) => (
                  <tr key={sv.maSV}>
                    <td><strong>{sv.maSV}</strong></td>
                    <td>{sv.hoTen}</td>
                    <td>{sv.email}</td>
                    <td><span className="badge">{sv.maLop}</span></td>
                    {isAdmin && (
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(sv.maSV)}
                          disabled={deletingMaSV === sv.maSV}
                        >
                          {deletingMaSV === sv.maSV ? 'Đang xóa...' : '🗑️ Xóa'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Thanh điều hướng phân trang (Pagination Bar) */}
          <div className="pagination-bar">
            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePrevPage}
              disabled={page <= 1 || loading}
            >
              ⬅ Trước
            </button>
            <span className="pagination-info">
              Trang <strong>{page}</strong> / <strong>{pagination.totalPages || 1}</strong>
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleNextPage}
              disabled={page >= pagination.totalPages || pagination.totalPages === 0 || loading}
            >
              Sau ➡
            </button>
          </div>
        </>
      )}
    </div>
  );
};

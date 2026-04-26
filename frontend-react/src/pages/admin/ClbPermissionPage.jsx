/**
 * ClbPermissionPage — Phân quyền CLB cho BCH/Tài khoản
 * Cho phép Admin gán quyền quản lý CLB cụ thể cho từng tài khoản BCH.
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Unlock, Save, Download, RefreshCw, Plus, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';

const ClbPermissionPage = () => {
  const { hasPermission } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedClbs, setSelectedClbs] = useState([]);
  const [searchText, setSearchText] = useState('');

  // Fetch matrix data (danh sách account và CLB)
  const { data: matrixData = {}, isLoading: matrixLoading, refetch } = useQuery({
    queryKey: ['clb-permission-matrix'],
    queryFn: () =>
      api.get('/api/clb-permissions/matrix')
        .then(r => r.data?.data || { accounts: [], clbs: [] })
        .catch(err => {
          toast.error('Lỗi tải dữ liệu phân quyền: ' + (err.response?.data?.message || err.message));
          return { accounts: [], clbs: [] };
        }),
  });

  // Mutation: Cập nhật CLB cho account
  const updateClbMutation = useMutation({
    mutationFn: (data) =>
      api.put(`/api/clb-permissions/account/${data.accountId}`, { clbIds: data.clbIds }),
    onSuccess: () => {
      toast.success('Cập nhật phân quyền CLB thành công');
      queryClient.invalidateQueries(['clb-permission-matrix']);
      setEditMode(false);
      setSelectedAccount(null);
      setSelectedClbs([]);
    },
    onError: (err) => {
      toast.error('Lỗi cập nhật: ' + (err.response?.data?.message || err.message));
    },
  });

  // Mutation: Thêm CLB vào account
  const addClbMutation = useMutation({
    mutationFn: (data) =>
      api.post(`/api/clb-permissions/account/${data.accountId}/clb/${data.maBan}`, {}),
    onSuccess: () => {
      toast.success('Thêm CLB thành công');
      queryClient.invalidateQueries(['clb-permission-matrix']);
    },
    onError: (err) => {
      toast.error('Lỗi thêm CLB: ' + (err.response?.data?.message || err.message));
    },
  });

  // Mutation: Xóa CLB khỏi account
  const deleteClbMutation = useMutation({
    mutationFn: (data) =>
      api.delete(`/api/clb-permissions/account/${data.accountId}/clb/${data.maBan}`),
    onSuccess: () => {
      toast.success('Xóa CLB thành công');
      queryClient.invalidateQueries(['clb-permission-matrix']);
    },
    onError: (err) => {
      toast.error('Lỗi xóa CLB: ' + (err.response?.data?.message || err.message));
    },
  });

  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setSelectedClbs(account.managedClbIds || []);
    setEditMode(false);
  };

  const handleToggleClb = (maBan) => {
    setSelectedClbs(prev =>
      prev.includes(maBan)
        ? prev.filter(id => id !== maBan)
        : [...prev, maBan]
    );
  };

  const handleSaveChanges = () => {
    if (!selectedAccount) return;
    updateClbMutation.mutate({
      accountId: selectedAccount.id,
      clbIds: selectedClbs,
    });
  };

  const handleAddClbQuick = (maBan) => {
    if (!selectedAccount) return;
    addClbMutation.mutate({
      accountId: selectedAccount.id,
      maBan,
    });
  };

  const handleDeleteClbQuick = (maBan) => {
    if (!selectedAccount) return;
    deleteClbMutation.mutate({
      accountId: selectedAccount.id,
      maBan,
    });
  };

  const filteredAccounts = matrixData.accounts?.filter(acc =>
    acc.username.toLowerCase().includes(searchText.toLowerCase()) ||
    acc.hoTen.toLowerCase().includes(searchText.toLowerCase())
  ) || [];

  const allClbs = matrixData.clbs || [];

  if (!hasPermission('QUAN_LY_PHAN_QUYEN_TAI_KHOAN')) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600" />
        <span className="text-yellow-800">Bạn không có quyền quản lý phân quyền CLB</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Phân Quyền Quản Lý CLB</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gán quyền quản lý CLB cụ thể cho từng ban chấp hành / tài khoản
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={matrixLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${matrixLoading ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
        </div>
      </div>

      {matrixLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 w-12 h-12"></div>
          <p className="text-gray-600 mt-4">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Account List (Sidebar) ─────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-fit">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-3">Danh Sách Tài Khoản</h2>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {filteredAccounts.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Không tìm thấy tài khoản
                </div>
              ) : (
                filteredAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleSelectAccount(account)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      selectedAccount?.id === account.id
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{account.hoTen}</div>
                    <div className="text-gray-600 text-xs">{account.username}</div>
                    <div className="text-blue-600 text-xs mt-1">
                      {account.managedClbIds?.length || 0} CLB
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ─── CLB Assignment Panel ───────────────────────────────────────── */}
          <div className="lg:col-span-2">
            {selectedAccount ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                {/* Account Info */}
                <div className="pb-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedAccount.hoTen}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Tài khoản: {selectedAccount.username}
                  </p>
                </div>

                {/* Current CLBs */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    CLB Được Quản Lý ({selectedClbs.length})
                  </h4>
                  {editMode ? (
                    <div className="space-y-3">
                      {allClbs.map((clb) => (
                        <label
                          key={clb.maBan}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedClbs.includes(clb.maBan)}
                            onChange={() => handleToggleClb(clb.maBan)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {clb.tenBan}
                            </div>
                            <div className="text-xs text-gray-600">{clb.maBan}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedClbs.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Chưa có CLB nào</p>
                      ) : (
                        selectedClbs.map((maBan) => {
                          const clb = allClbs.find(c => c.maBan === maBan);
                          return (
                            <div
                              key={maBan}
                              className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                            >
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {clb?.tenBan}
                                </div>
                                <div className="text-xs text-gray-600">{maBan}</div>
                              </div>
                              <button
                                onClick={() => handleDeleteClbQuick(maBan)}
                                disabled={deleteClbMutation.isPending}
                                className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  {editMode ? (
                    <>
                      <button
                        onClick={handleSaveChanges}
                        disabled={updateClbMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {updateClbMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setSelectedClbs(selectedAccount.managedClbIds || []);
                        }}
                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Chỉnh Sửa
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Chọn tài khoản để khởi động</p>
                <p className="text-gray-500 text-sm mt-2">
                  Nhấp vào tài khoản từ danh sách để quản lý quyền CLB
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Hướng dẫn:</strong> Gán quyền quản lý CLB cho từng tài khoản BCH. 
          Tài khoản sẽ chỉ có thể quản lý các CLB được chỉ định, 
          ngay cả khi có quyền XEM_CLB, THEM_CLB, v.v.
        </div>
      </div>
    </div>
  );
};

export default ClbPermissionPage;

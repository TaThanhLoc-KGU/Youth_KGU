import { useState, useEffect, useCallback } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import settingsService from '../../services/settingsService';

const CATEGORY_LABELS = {
  HOAT_DONG: 'Hoạt động',
  DIEM_DANH: 'Điểm danh',
  SINH_VIEN: 'Sinh viên',
  TAI_KHOAN: 'Tài khoản',
  BAO_CAO: 'Báo cáo',
};

export default function SettingsPage() {
  const [accounts, setAccounts] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [checkedIds, setCheckedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initing, setIniting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [perms, accs] = await Promise.all([
        settingsService.getAllPermissions(),
        settingsService.getManagementAccounts(),
      ]);
      setPermissions(perms);
      setAccounts(accs);
    } catch {
      showToast('Không thể tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectAccount = async (account) => {
    setSelectedAccount(account);
    try {
      const ids = await settingsService.getAccountPermissions(account.taikhoanId);
      setCheckedIds(ids);
    } catch {
      showToast('Không thể tải quyền tài khoản', 'error');
      setCheckedIds([]);
    }
  };

  const handleToggle = (id) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!selectedAccount) return;
    setSaving(true);
    try {
      await settingsService.assignPermissions(selectedAccount.taikhoanId, checkedIds);
      showToast('Phân quyền thành công');
      // Cập nhật lại danh sách accounts
      setAccounts((prev) =>
        prev.map((a) =>
          a.taikhoanId === selectedAccount.taikhoanId
            ? { ...a, assignedPermissionIds: checkedIds }
            : a
        )
      );
    } catch {
      showToast('Lưu quyền thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInit = async () => {
    setIniting(true);
    try {
      const res = await settingsService.initPermissions();
      showToast(res?.message || 'Khởi tạo thành công');
      await loadData();
    } catch {
      showToast('Khởi tạo thất bại', 'error');
    } finally {
      setIniting(false);
    }
  };

  const filteredAccounts = accounts.filter((a) => {
    const q = search.toLowerCase();
    return (
      (a.hoTen || '').toLowerCase().includes(q) ||
      (a.username || '').toLowerCase().includes(q)
    );
  });

  const hasPermissions = Object.keys(permissions).length > 0;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Cài đặt phân quyền</h1>
        <p className="text-gray-500 mt-1">Quản lý quyền chức năng cho từng tài khoản quản lý</p>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 h-full">
          {/* Panel trái - danh sách tài khoản */}
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <Card padding={false}>
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-700 mb-3">Tài khoản quản lý</h2>
                <input
                  type="text"
                  placeholder="Tìm kiếm tên, username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input input-bordered input-sm w-full"
                />
              </div>
              <div className="overflow-y-auto max-h-64 lg:max-h-[calc(100vh-280px)]">
                {filteredAccounts.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">Không có tài khoản</p>
                ) : (
                  filteredAccounts.map((account) => (
                    <button
                      key={account.taikhoanId}
                      onClick={() => handleSelectAccount(account)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedAccount?.taikhoanId === account.taikhoanId
                          ? 'bg-primary/5 border-l-4 border-l-primary'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {account.hoTen || account.username}
                          </p>
                          <p className="text-xs text-gray-500">@{account.username}</p>
                        </div>
                        <Badge variant="info" size="sm">
                          {account.assignedPermissionIds?.length || 0}
                        </Badge>
                      </div>
                      {account.vaiTro && (
                        <span className="text-xs text-gray-400 mt-0.5 block truncate">
                          {account.vaiTro}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Panel phải - danh sách quyền */}
          <div className="w-full lg:w-2/3">
            {!hasPermissions ? (
              <Card>
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Chưa có dữ liệu quyền trong hệ thống.</p>
                  <Button
                    variant="primary"
                    onClick={handleInit}
                    isLoading={initing}
                  >
                    Khởi tạo dữ liệu quyền
                  </Button>
                </div>
              </Card>
            ) : selectedAccount ? (
              <Card padding={false}>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedAccount.hoTen || selectedAccount.username}
                    </h2>
                    <p className="text-sm text-gray-500">
                      @{selectedAccount.username} · {selectedAccount.vaiTro}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      isLoading={saving}
                    >
                      Lưu quyền
                    </Button>
                  </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-96 lg:max-h-[calc(100vh-260px)]">
                  {Object.entries(permissions).map(([category, perms]) => (
                    <div key={category} className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 pb-1 border-b border-gray-200">
                        {CATEGORY_LABELS[category] || category}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="checkbox checkbox-primary checkbox-sm mt-0.5"
                              checked={checkedIds.includes(perm.id)}
                              onChange={() => handleToggle(perm.id)}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {perm.description}
                              </p>
                              <p className="text-xs text-gray-400">{perm.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-20 text-gray-400">
                  <p className="text-lg">Chọn một tài khoản để phân quyền</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

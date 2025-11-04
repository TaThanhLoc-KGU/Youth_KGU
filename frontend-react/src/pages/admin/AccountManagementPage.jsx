import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import accountService from '../../services/accountService';
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
  ROLE_LABELS,
  GENDER_LABELS
} from '../../constants/accountConstants';
import { formatDate } from '../../utils/dateFormat';

export default function AccountManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending'); // pending, all, search
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveNote, setApproveNote] = useState('');

  // Query: Pending Approvals
  const { data: pendingAccounts = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingAccounts'],
    queryFn: () => accountService.getPendingApprovals()
  });

  // Query: Search Results
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['searchAccounts', searchKeyword],
    queryFn: () => accountService.searchAccounts(searchKeyword),
    enabled: searchKeyword.length > 0
  });

  // Mutation: Approve Account
  const approveMutation = useMutation({
    mutationFn: ({ accountId, note }) =>
      accountService.approveAccount(accountId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      setShowApproveModal(false);
      setSelectedAccount(null);
      setApproveNote('');
    }
  });

  // Mutation: Reject Account
  const rejectMutation = useMutation({
    mutationFn: ({ accountId, reason }) =>
      accountService.rejectAccount(accountId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      setShowRejectModal(false);
      setSelectedAccount(null);
      setRejectReason('');
    }
  });

  // Mutation: Change Role
  const changeRoleMutation = useMutation({
    mutationFn: ({ accountId, vaiTro }) =>
      accountService.changeRole(accountId, vaiTro),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
    }
  });

  // Mutation: Set Account Active
  const setActiveMutation = useMutation({
    mutationFn: ({ accountId, isActive }) =>
      accountService.setAccountActive(accountId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
    }
  });

  const handleApprove = (account) => {
    setSelectedAccount(account);
    setShowApproveModal(true);
  };

  const handleReject = (account) => {
    setSelectedAccount(account);
    setShowRejectModal(true);
  };

  const handleConfirmApprove = () => {
    if (selectedAccount) {
      approveMutation.mutate({
        accountId: selectedAccount.id,
        note: approveNote
      });
    }
  };

  const handleConfirmReject = () => {
    if (selectedAccount && rejectReason.trim()) {
      rejectMutation.mutate({
        accountId: selectedAccount.id,
        reason: rejectReason
      });
    }
  };

  const AccountTable = ({ accounts, loading }) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Tên đăng nhập</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Họ tên</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Vai trò</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                Đang tải...
              </td>
            </tr>
          ) : accounts.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            accounts.map((account) => (
              <tr key={account.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{account.username}</td>
                <td className="px-4 py-3 text-sm">{account.email}</td>
                <td className="px-4 py-3">{account.hoTen || 'N/A'}</td>
                <td className="px-4 py-3 text-sm">
                  {ROLE_LABELS[account.vaiTro] || account.vaiTro}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{
                      backgroundColor: APPROVAL_STATUS_COLORS[account.trangThaiPheDuyet]
                    }}
                  >
                    {APPROVAL_STATUS_LABELS[account.trangThaiPheDuyet]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {account.trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
                      <>
                        <button
                          onClick={() => handleApprove(account)}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded"
                        >
                          Phê duyệt
                        </button>
                        <button
                          onClick={() => handleReject(account)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    {account.isActive && (
                      <button
                        onClick={() =>
                          setActiveMutation.mutate({
                            accountId: account.id,
                            isActive: false
                          })
                        }
                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded"
                      >
                        Vô hiệu
                      </button>
                    )}
                    {!account.isActive && (
                      <button
                        onClick={() =>
                          setActiveMutation.mutate({
                            accountId: account.id,
                            isActive: true
                          })
                        }
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded"
                      >
                        Kích hoạt
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý tài khoản</h1>
        <p className="text-gray-600 mt-2">Quản lý tài khoản người dùng và phê duyệt đơn đăng ký</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b">
        <button
          onClick={() => {
            setActiveTab('pending');
            setSearchKeyword('');
          }}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Chờ phê duyệt ({pendingAccounts.length})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'search'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Tìm kiếm
        </button>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm theo username, email hoặc tên..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'pending' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Tài khoản chờ phê duyệt</h2>
            <AccountTable accounts={pendingAccounts} loading={pendingLoading} />
          </div>
        )}

        {activeTab === 'search' && searchKeyword && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Kết quả tìm kiếm</h2>
            <AccountTable accounts={searchResults} loading={searchLoading} />
          </div>
        )}

        {activeTab === 'search' && !searchKeyword && (
          <div className="p-6 text-center text-gray-500">
            Nhập từ khóa để tìm kiếm tài khoản
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Phê duyệt tài khoản</h2>
            <p className="text-gray-600 mb-4">
              Phê duyệt tài khoản cho <strong>{selectedAccount.username}</strong>?
            </p>
            <textarea
              placeholder="Ghi chú (tùy chọn)"
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={approveMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                {approveMutation.isPending ? 'Đang xử lý...' : 'Phê duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Từ chối tài khoản</h2>
            <p className="text-gray-600 mb-4">
              Từ chối tài khoản cho <strong>{selectedAccount.username}</strong>?
            </p>
            <textarea
              placeholder="Lý do từ chối (bắt buộc)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows="3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                {rejectMutation.isPending ? 'Đang xử lý...' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, SkipForward } from 'lucide-react';
import Table from '../../../common/Table';
import Badge from '../../../common/Badge';
import Button from '../../../common/Button';

const PreviewTable = ({
  rows = [],
  validationErrors = {},
  showOnlyErrors = false,
  onShowOnlyErrorsChange,
  stats = {}
}) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const getRowStatus = (maSo) => {
    if (validationErrors[maSo]) {
      return { status: 'error', label: 'Lỗi' };
    }
    return { status: 'ok', label: 'OK' };
  };

  const filteredRows = showOnlyErrors
    ? rows.filter(row => validationErrors[row.maSo])
    : rows;

  const columns = [
    {
      header: '',
      accessor: 'expand',
      width: '40px',
      render: (_, row) => validationErrors[row.maSo] ? (
        <button
          onClick={() => setExpandedRow(expandedRow === row.maSo ? null : row.maSo)}
          className="p-1 hover:bg-gray-200 rounded"
        >
          {expandedRow === row.maSo ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      ) : null,
    },
    {
      header: 'Mã số',
      accessor: 'maSo',
      render: (value, row) => {
        const status = getRowStatus(value);
        return (
          <div className="flex items-center gap-2">
            {status.status === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-600" />
            )}
            <span className="font-medium">{value}</span>
          </div>
        );
      },
    },
    {
      header: 'Họ tên',
      accessor: 'hoTen',
      render: (value) => <span className="text-gray-900">{value || '(không có)'}</span>,
    },
    {
      header: 'Loại',
      accessor: 'loaiThanhVien',
      render: (value) => {
        const variants = {
          SINH_VIEN: 'success',
          GIANG_VIEN: 'info',
          CHUYEN_VIEN: 'warning'
        };
        const labels = {
          SINH_VIEN: 'Sinh viên',
          GIANG_VIEN: 'Giảng viên',
          CHUYEN_VIEN: 'Chuyên viên'
        };
        return <Badge variant={variants[value] || 'secondary'}>{labels[value] || value}</Badge>;
      },
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (value) => <span className="text-gray-600 text-sm">{value || '(không có)'}</span>,
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (_, row) => {
        const status = getRowStatus(row.maSo);
        return (
          <div className="flex items-center gap-2">
            {status.status === 'error' ? (
              <Badge variant="danger">Lỗi</Badge>
            ) : (
              <Badge variant="success">OK</Badge>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 uppercase tracking-wide">Tổng số</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total || rows.length}</p>
          </div>
          {stats.success !== undefined && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Sẽ tạo mới</p>
              <p className="text-2xl font-bold text-green-600">{stats.success || 0}</p>
            </div>
          )}
          {stats.skipped !== undefined && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Bỏ qua</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.skipped || 0}</p>
            </div>
          )}
          {stats.error !== undefined && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Lỗi</p>
              <p className="text-2xl font-bold text-red-600">{stats.error || 0}</p>
            </div>
          )}
        </div>
      )}

      {/* Filter Error Rows */}
      {filteredRows.length > 0 && (
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyErrors}
              onChange={(e) => onShowOnlyErrorsChange?.(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Chỉ hiển thị hàng có lỗi ({rows.filter(r => validationErrors[r.maSo]).length})
            </span>
          </label>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table
          columns={columns}
          data={filteredRows}
          rowClassName={(row) =>
            validationErrors[row.maSo]
              ? 'bg-red-50 hover:bg-red-100'
              : 'hover:bg-gray-50'
          }
        />
      </div>

      {/* Expanded Error Details */}
      {expandedRow && validationErrors[expandedRow] && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
          <p className="font-semibold text-red-900">Lỗi cho mã số {expandedRow}:</p>
          <ul className="space-y-1">
            {validationErrors[expandedRow].map((error, idx) => (
              <li key={idx} className="text-sm text-red-800 flex gap-2">
                <span>•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty State */}
      {filteredRows.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {showOnlyErrors ? (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
              <p>Không có lỗi, dữ liệu sẵn sàng tạo tài khoản!</p>
            </>
          ) : (
            <p>Không có dữ liệu</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PreviewTable;

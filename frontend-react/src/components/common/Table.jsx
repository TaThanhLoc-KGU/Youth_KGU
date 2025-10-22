import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import clsx from 'clsx';
import Loading from './Loading';

const Table = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'Không có dữ liệu',
  onRowClick,
  className,
}) => {
  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg">
        <Loading text="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={clsx('overflow-x-auto border border-gray-200 rounded-lg', className)}>
      <table className="table">
        <thead className="table-header">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={clsx('table-header-cell', column.headerClassName)}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table-body">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={clsx(
                onRowClick && 'cursor-pointer hover:bg-gray-50 transition-colors'
              )}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={clsx('table-cell', column.cellClassName)}
                >
                  {column.render
                    ? column.render(row[column.accessor], row, rowIndex)
                    : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Pagination = ({
  currentPage = 0,
  totalPages = 1,
  pageSize = 10,
  totalElements = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  const canPreviousPage = currentPage > 0;
  const canNextPage = currentPage < totalPages - 1;

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        for (let i = 0; i < 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages - 1);
      } else if (currentPage >= totalPages - 3) {
        pages.push(0);
        pages.push('...');
        for (let i = totalPages - 4; i < totalPages; i++) pages.push(i);
      } else {
        pages.push(0);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages - 1);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 sm:px-6">
      {/* Info */}
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-700">
          Hiển thị <span className="font-medium">{startItem}</span> đến{' '}
          <span className="font-medium">{endItem}</span> trong tổng số{' '}
          <span className="font-medium">{totalElements}</span> kết quả
        </p>

        {/* Page Size Selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Hiển thị:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="form-input py-1 text-sm"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(0)}
          disabled={!canPreviousPage}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Trang đầu"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPreviousPage}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Trang trước"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-1">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={clsx(
                  'px-3 py-1 rounded-lg transition-colors',
                  page === currentPage
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                )}
              >
                {page + 1}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNextPage}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Trang sau"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNextPage}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Trang cuối"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

Table.Pagination = Pagination;

export default Table;

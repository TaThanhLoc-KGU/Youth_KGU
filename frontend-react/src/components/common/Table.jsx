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
      <div className="overflow-x-auto border border-base-300 rounded-lg">
        <Loading text="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="overflow-x-auto border border-base-300 rounded-lg p-8 text-center">
        <p className="text-base-content/60">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="table table-zebra w-full">
        <thead className="bg-base-200">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={clsx('bg-base-200', column.headerClassName)}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={clsx(
                onRowClick && 'cursor-pointer hover:bg-base-200'
              )}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={clsx(column.cellClassName)}
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
    <div className="flex items-center justify-between px-4 py-3 border-t border-base-300 sm:px-6">
      {/* Info */}
      <div className="flex items-center gap-4">
        <p className="text-sm">
          Hiển thị <span className="font-medium">{startItem}</span> đến{' '}
          <span className="font-medium">{endItem}</span> trong tổng số{' '}
          <span className="font-medium">{totalElements}</span> kết quả
        </p>

        {/* Page Size Selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label className="text-sm">Hiển thị:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="select select-bordered select-sm w-20"
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
      <div className="join">
        <button
          onClick={() => onPageChange(0)}
          disabled={!canPreviousPage}
          className="join-item btn btn-sm"
          title="Trang đầu"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPreviousPage}
          className="join-item btn btn-sm"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <button key={`ellipsis-${index}`} className="join-item btn btn-sm btn-disabled">
              ...
            </button>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={clsx(
                'join-item btn btn-sm',
                page === currentPage && 'btn-active'
              )}
            >
              {page + 1}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNextPage}
          className="join-item btn btn-sm"
          title="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNextPage}
          className="join-item btn btn-sm"
          title="Trang cuối"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

Table.Pagination = Pagination;

export default Table;

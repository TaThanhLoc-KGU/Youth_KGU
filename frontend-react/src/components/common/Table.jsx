import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox } from 'lucide-react';
import clsx from 'clsx';

const SkeletonRow = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + (i * 13 % 30)}%` }} />
      </td>
    ))}
  </tr>
);

const Table = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'Không có dữ liệu',
  onRowClick,
  striped = false,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={clsx('overflow-x-auto rounded-xl border border-gray-200', className)}>
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="table-header-cell" style={{ width: col.width }}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} cols={columns.length} />)}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={clsx('rounded-xl border border-gray-200 bg-white', className)}>
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('overflow-x-auto rounded-xl border border-gray-200', className)}>
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50/80">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={clsx('table-header-cell', col.headerClassName,
                  col.accessor === 'actions' && 'text-right')}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id ?? row.maSv ?? row.maKhoa ?? row.maLop ?? rowIndex}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                'transition-colors',
                onRowClick && 'cursor-pointer hover:bg-blue-50/30',
                !onRowClick && 'hover:bg-gray-50/60',
                striped && rowIndex % 2 === 1 && 'bg-gray-50/40',
              )}
            >
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  className={clsx(
                    'table-cell',
                    col.cellClassName,
                    col.accessor === 'actions' && 'text-right',
                  )}
                >
                  {col.render ? col.render(row[col.accessor], row, rowIndex) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({
  currentPage = 0,
  totalPages = 1,
  pageSize = 10,
  totalElements = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const start = currentPage * pageSize + 1;
  const end   = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Hiển thị</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          {pageSizeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span>
          {totalElements > 0 ? `${start}–${end} / ${totalElements} bản ghi` : 'Không có bản ghi'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <PagBtn onClick={() => onPageChange(0)} disabled={currentPage === 0} title="Trang đầu"><ChevronsLeft className="w-4 h-4" /></PagBtn>
        <PagBtn onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0} title="Trang trước"><ChevronLeft className="w-4 h-4" /></PagBtn>
        <span className="px-3 py-1.5 text-sm font-medium text-gray-700 min-w-[80px] text-center">
          {currentPage + 1} / {Math.max(totalPages, 1)}
        </span>
        <PagBtn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1} title="Trang sau"><ChevronRight className="w-4 h-4" /></PagBtn>
        <PagBtn onClick={() => onPageChange(totalPages - 1)} disabled={currentPage >= totalPages - 1} title="Trang cuối"><ChevronsRight className="w-4 h-4" /></PagBtn>
      </div>
    </div>
  );
};

const PagBtn = ({ children, disabled, onClick, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
  >
    {children}
  </button>
);

Table.Pagination = Pagination;
export { Pagination };
export default Table;

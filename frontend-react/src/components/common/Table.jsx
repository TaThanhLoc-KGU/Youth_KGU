import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox } from 'lucide-react';
import clsx from 'clsx';

const SkeletonRow = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3.5 hidden md:table-cell">
        <div
          className="h-3.5 bg-slate-100 rounded-full animate-pulse"
          style={{ width: `${50 + (i * 17 % 40)}%` }}
        />
      </td>
    ))}
    {/* Mobile skeleton */}
    <td className="p-4 md:hidden">
      <div className="space-y-2.5">
        <div className="h-3.5 bg-slate-100 rounded-full animate-pulse w-3/4" />
        <div className="h-3 bg-slate-100 rounded-full animate-pulse w-1/2" />
        <div className="h-3 bg-slate-100 rounded-full animate-pulse w-2/3" />
      </div>
    </td>
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
  mobileCards = true,
}) => {
  const wrapClass = clsx(
    'rounded-2xl bg-white overflow-hidden',
    'ring-1 ring-slate-200/80',
    className
  );

  const isActions = (col) => col.accessor === 'actions' || col.headerClassName?.includes('actions');

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className={wrapClass}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60">
                {columns.map((col, i) => (
                  <th key={i} className="table-header-cell hidden md:table-cell" style={{ width: col.width }}>
                    {col.header}
                  </th>
                ))}
                <th className="table-header-cell md:hidden">Đang tải...</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...Array(4)].map((_, i) => <SkeletonRow key={i} cols={columns.length} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ── Empty ───────────────────────────────────────────────────────────── */
  if (data.length === 0) {
    return (
      <div className={wrapClass}>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-400">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  /* ── Table ───────────────────────────────────────────────────────────── */
  return (
    <div className={wrapClass}>
      <div className="overflow-x-auto">
        <table className={clsx('min-w-full', mobileCards && 'responsive-table')}>

          {/* Header — hidden on mobile when mobileCards */}
          <thead className={mobileCards ? 'hidden md:table-header-group' : undefined}>
            <tr className="border-b border-slate-200 bg-slate-100/70">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={clsx(
                    'table-header-cell',
                    col.headerClassName,
                    isActions(col) && 'text-right',
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className={clsx(
            mobileCards
              ? 'block md:table-row-group divide-y-0 md:divide-y md:divide-slate-100'
              : 'divide-y divide-slate-100 bg-white',
          )}>
            {data.map((row, rowIndex) => (
              <tr
                key={row.id ?? row.maSv ?? row.maHoatDong ?? row.key ?? row.maKhoa ?? row.maLop ?? rowIndex}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  'group transition-colors duration-100',
                  // Mobile card style
                  mobileCards && [
                    'flex flex-col mb-2.5 rounded-xl overflow-hidden',
                    'md:table-row md:mb-0 md:rounded-none md:overflow-visible',
                    'ring-1 ring-slate-200/70 md:ring-0',
                    'bg-white',
                  ],
                  onRowClick && 'cursor-pointer hover:bg-primary/[0.03]',
                  !onRowClick && 'hover:bg-slate-50/60',
                  striped && rowIndex % 2 === 1 && !mobileCards && 'bg-slate-50/30',
                )}
              >
                {columns.map((col, colIndex) => {
                  const cellContent = col.render
                    ? col.render(row[col.accessor], row, rowIndex)
                    : row[col.accessor];
                  const label = typeof col.header === 'string' ? col.header : '';
                  const actions = isActions(col);

                  return (
                    <td
                      key={colIndex}
                      data-label={label}
                      data-actions={actions ? '' : undefined}
                      className={clsx(
                        'table-cell',
                        col.cellClassName,
                        // Desktop: right-align actions
                        actions && 'text-right',
                        // Mobile card: show as flex row with label
                        mobileCards && !actions && [
                          'flex items-start justify-between gap-2 border-b border-slate-100 last:border-0',
                          'md:table-cell md:border-0',
                        ],
                        // Mobile: actions row right-aligned, no label
                        mobileCards && actions && [
                          'flex justify-end border-t border-slate-100 bg-slate-50/50 md:bg-transparent',
                          'md:table-cell md:border-0',
                        ],
                      )}
                    >
                      {/* Mobile label (only non-action columns) */}
                      {mobileCards && !actions && label && (
                        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-0.5 min-w-[80px] md:hidden">
                          {label}
                        </span>
                      )}
                      <span className={clsx(mobileCards && !actions && 'flex-1 min-w-0 text-right md:text-left')}>
                        {cellContent}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile scroll hint */}
      <div className="hidden md:hidden pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white/80" />
    </div>
  );
};

/* ── Pagination ──────────────────────────────────────────────────────────── */
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

  const pageNums = (() => {
    const pages = [];
    for (
      let i = Math.max(0, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) pages.push(i);
    return pages;
  })();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs">
      <div className="flex items-center gap-2 text-slate-500">
        <span>Hiển thị</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        >
          {pageSizeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-slate-400">
          {totalElements > 0
            ? <><strong className="font-semibold text-slate-600">{start}–{end}</strong> / {totalElements}</>
            : 'Không có bản ghi'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <PagBtn onClick={() => onPageChange(0)} disabled={currentPage === 0}><ChevronsLeft className="w-3.5 h-3.5" /></PagBtn>
        <PagBtn onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0}><ChevronLeft className="w-3.5 h-3.5" /></PagBtn>

        {pageNums[0] > 0 && (
          <><PagBtn onClick={() => onPageChange(0)}>1</PagBtn>
          {pageNums[0] > 1 && <span className="px-0.5 text-slate-300">…</span>}</>
        )}

        {pageNums.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={clsx(
              'min-w-[28px] h-7 rounded-lg text-xs font-medium transition-all',
              p === currentPage
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white',
            )}
          >
            {p + 1}
          </button>
        ))}

        {pageNums[pageNums.length - 1] < totalPages - 1 && (
          <>{pageNums[pageNums.length - 1] < totalPages - 2 && <span className="px-0.5 text-slate-300">…</span>}
          <PagBtn onClick={() => onPageChange(totalPages - 1)}>{totalPages}</PagBtn></>
        )}

        <PagBtn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1}><ChevronRight className="w-3.5 h-3.5" /></PagBtn>
        <PagBtn onClick={() => onPageChange(totalPages - 1)} disabled={currentPage >= totalPages - 1}><ChevronsRight className="w-3.5 h-3.5" /></PagBtn>
      </div>
    </div>
  );
};

const PagBtn = ({ children, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="min-w-[28px] h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
  >
    {children}
  </button>
);

Table.Pagination = Pagination;
export { Pagination };
export default Table;

import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, ChevronRight } from 'lucide-react';
import { findNavTrail } from '../../config/adminNav';

/** Dải breadcrumb: Menu chức năng › [Phân hệ] › [Chức năng]. Ẩn trên trang hub. */
export default function HubBreadcrumb() {
  const { pathname } = useLocation();
  // chỉ hiện trong khu /admin/* (trừ chính trang hub)
  if (!pathname.startsWith('/admin/') || pathname.startsWith('/admin/hub')) return null;

  const trail = findNavTrail(pathname);
  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 flex-wrap">
      <Link to="/admin" className="inline-flex items-center gap-1.5 hover:text-primary">
        <LayoutGrid className="w-4 h-4" /> Menu chức năng
      </Link>
      {trail?.group && trail.group.key !== 'dashboard' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link to={`/admin/hub/${trail.group.key}`} className="hover:text-primary">{trail.group.label}</Link>
        </>
      )}
      {trail?.item && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-700 font-medium">{trail.item.label}</span>
        </>
      )}
    </nav>
  );
}

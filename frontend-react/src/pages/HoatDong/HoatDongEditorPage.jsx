import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ActivityForm from '../../components/activity/ActivityForm';
import activityService from '../../services/activityService';

/**
 * Trang tạo / chỉnh sửa hoạt động — dùng ActivityForm đầy đủ (có RenLuyenSelector).
 *
 * Props:
 *   backPath – đường dẫn quay lại sau khi lưu (vd: '/admin/activities', '/bch/activities')
 */
const HoatDongEditorPage = ({ backPath = '/admin/activities' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('ma'); // maHoatDong khi edit (dùng query param để tránh lỗi slash trong URL path)
  const isEdit = !!id;

  const { data: existing, isLoading } = useQuery({
    queryKey: ['hoat-dong-detail', id],
    queryFn: () => activityService.getById(id),
    enabled: isEdit,
    staleTime: 0,
  });

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Back button */}
      <button
        onClick={() => navigate(backPath)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách
      </button>

      <ActivityForm
        initialData={isEdit ? existing : null}
        mode={isEdit ? 'edit' : 'create'}
        onSuccess={() => navigate(backPath)}
        onCancel={() => navigate(backPath)}
      />
    </div>
  );
};

export default HoatDongEditorPage;

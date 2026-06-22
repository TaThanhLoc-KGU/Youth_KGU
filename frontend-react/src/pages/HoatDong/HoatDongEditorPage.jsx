import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ActivityForm from '../../components/activity/ActivityForm';
import ClbActivityForm from '../../components/activity/ClbActivityForm';
import KhoaActivityForm from '../../components/activity/KhoaActivityForm';
import activityService from '../../services/activityService';
import useAuthStore from '../../stores/authStore';

const HoatDongEditorPage = ({ backPath = '/admin/activities' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('ma');
  const isEdit = !!id;

  const maClb  = useAuthStore((s) => s.maClb);
  const maKhoa = useAuthStore((s) => s.maKhoa);
  const scope  = maClb ? 'clb' : maKhoa ? 'khoa' : 'admin';

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

  // Chọn Form dựa trên scope
  const renderForm = () => {
    const props = {
      initialData: isEdit ? existing : null,
      mode: isEdit ? 'edit' : 'create',
      onSuccess: () => navigate(backPath),
      onCancel: () => navigate(backPath)
    };

    if (scope === 'clb')   return <ClbActivityForm {...props} />;
    if (scope === 'khoa')  return <KhoaActivityForm {...props} />;
    return <ActivityForm {...props} scope="admin" />;
  };

  return (
    <div className="md:p-6 p-4 pb-0 md:pb-6">
      <button
        onClick={() => navigate(backPath)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4 md:mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại {scope === 'clb' ? 'Portal CLB' : scope === 'khoa' ? 'Portal Khoa' : 'danh sách'}
      </button>

      {renderForm()}
    </div>
  );
};

export default HoatDongEditorPage;

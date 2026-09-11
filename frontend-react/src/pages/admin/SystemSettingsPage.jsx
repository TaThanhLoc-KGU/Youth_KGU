import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { SlidersHorizontal, Loader2, CalendarCheck, Newspaper, Mailbox, ServerCog } from 'lucide-react';
import systemSettingService from '../../services/systemSettingService';

const NHOM_META = {
  HOAT_DONG: { label: 'Hoạt động', icon: CalendarCheck },
  TIN_TUC:   { label: 'Tin tức', icon: Newspaper },
  GOP_Y:     { label: 'Góp ý', icon: Mailbox },
  HE_THONG:  { label: 'Hệ thống', icon: ServerCog },
  KHAC:      { label: 'Khác', icon: SlidersHorizontal },
};

function ToggleRow({ item, onToggle, saving }) {
  const on = item.giaTri === 'true' || item.giaTri === '1';
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 px-4 border-b border-gray-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{item.moTa || item.key}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{item.key}</p>
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={() => onToggle(item.key, on ? 'false' : 'true')}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-gray-300'} ${saving ? 'opacity-50' : ''}`}
        aria-pressed={on}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function StringRow({ item, onSave, saving }) {
  const [val, setVal] = useState(item.giaTri || '');
  useEffect(() => setVal(item.giaTri || ''), [item.giaTri]);
  const dirty = val !== (item.giaTri || '');
  return (
    <div className="py-3.5 px-4 border-b border-gray-100 last:border-0">
      <p className="text-sm font-medium text-gray-900">{item.moTa || item.key}</p>
      <p className="text-[11px] text-gray-400 mt-0.5 mb-2 font-mono">{item.key}</p>
      <div className="flex gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => onSave(item.key, val)}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-white font-medium disabled:opacity-40"
        >
          Lưu
        </button>
      </div>
    </div>
  );
}

export default function SystemSettingsPage() {
  const qc = useQueryClient();
  const { data: grouped, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: systemSettingService.getAll,
  });

  const mutation = useMutation({
    mutationFn: ({ key, giaTri }) => systemSettingService.update(key, giaTri),
    onSuccess: () => {
      toast.success('Đã lưu cài đặt');
      qc.invalidateQueries({ queryKey: ['system-settings'] });
      qc.invalidateQueries({ queryKey: ['public-settings'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lưu thất bại'),
  });

  const handleSet = (key, giaTri) => mutation.mutate({ key, giaTri });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const nhomEntries = Object.entries(grouped || {});

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-primary" /> Cài đặt hệ thống
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Bật/tắt các tính năng, chế độ bảo trì. Thay đổi có hiệu lực ngay.</p>
      </div>

      {nhomEntries.length === 0 && (
        <p className="text-sm text-gray-400">Chưa có cài đặt nào.</p>
      )}

      {nhomEntries.map(([nhom, items]) => {
        const meta = NHOM_META[nhom] || NHOM_META.KHAC;
        const Icon = meta.icon;
        return (
          <div key={nhom} className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{meta.label}</h2>
            </div>
            {items.map((item) =>
              item.kieu === 'BOOLEAN'
                ? <ToggleRow key={item.key} item={item} onToggle={handleSet} saving={mutation.isPending} />
                : <StringRow key={item.key} item={item} onSave={handleSet} saving={mutation.isPending} />
            )}
          </div>
        );
      })}
    </div>
  );
}

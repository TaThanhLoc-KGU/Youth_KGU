import { useQuery } from '@tanstack/react-query';
import systemSettingService from '../services/systemSettingService';

/**
 * Đọc các feature-flag công khai (GET /api/system-settings/public) — không cần đăng nhập.
 * Dùng ở: banner bảo trì, ẩn/hiện form bình luận, ẩn/hiện form góp ý, text form tạo hoạt động khoa.
 *
 * @returns {{ isOn:(key:string)=>boolean, getVal:(key:string,def?:string)=>string, isLoading:boolean }}
 */
export default function usePublicSettings() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['public-settings'],
    queryFn: systemSettingService.getPublic,
    staleTime: 60_000,
    retry: 1,
  });

  const map = new Map(data.map((s) => [s.key, s.giaTri]));

  const isOn = (key) => {
    const v = map.get(key);
    return v === 'true' || v === '1';
  };
  const getVal = (key, def = '') => (map.has(key) ? map.get(key) : def);

  return { isOn, getVal, isLoading };
}

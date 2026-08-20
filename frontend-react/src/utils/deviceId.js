const STORAGE_KEY = 'youthkgu_device_id';

/**
 * UUID ẩn danh sinh phía client, lưu localStorage — dùng để dedup lượt thích
 * khi người dùng chưa đăng nhập (1 thiết bị = 1 lượt thích / bài viết).
 */
export const getOrCreateDeviceId = () => {
  let id = localStorage.getItem(STORAGE_KEY);
  if (id) return id;

  id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(STORAGE_KEY, id);
  return id;
};

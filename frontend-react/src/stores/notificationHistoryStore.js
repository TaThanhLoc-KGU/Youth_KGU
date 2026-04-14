/**
 * Store lưu lịch sử thông báo — persist vào localStorage để sống qua page refresh.
 * Đồng bộ từ backend khi load trang, merge thêm các thông báo nhận qua SSE.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_ITEMS = 50; // Giữ tối đa 50 thông báo gần nhất

const useNotificationHistoryStore = create(
  persist(
    (set) => ({
      items: [],
      unreadCount: 0,

      /**
       * Thêm một thông báo mới (từ SSE hoặc thủ công).
       * Deduplicate theo id.
       */
      add: (notif) => {
        const item = {
          ...notif,
          id:         notif.id         ?? `local-${Date.now()}`,
          receivedAt: notif.receivedAt ?? new Date().toISOString(),
          isRead:     notif.isRead     ?? false,
        };
        set((s) => {
          if (s.items.some((n) => n.id === item.id)) return s; // đã có rồi
          const items = [item, ...s.items].slice(0, MAX_ITEMS);
          return {
            items,
            unreadCount: s.unreadCount + (item.isRead ? 0 : 1),
          };
        });
      },

      /**
       * Đồng bộ danh sách từ backend: merge thay vì replace.
       * Ưu tiên isRead từ backend (source of truth).
       */
      syncFromBackend: (backendItems) => {
        if (!Array.isArray(backendItems) || backendItems.length === 0) return;
        set((s) => {
          const localIdSet = new Set(s.items.map((n) => n.id));
          const newOnes    = backendItems.filter((n) => !localIdSet.has(n.id));

          const merged = [
            ...newOnes.map((n) => ({
              ...n,
              receivedAt: n.createdAt ?? n.receivedAt ?? new Date().toISOString(),
            })),
            ...s.items,
          ].slice(0, MAX_ITEMS);

          // Đồng bộ trạng thái isRead từ backend
          const readMap = {};
          backendItems.forEach((n) => { readMap[n.id] = n.isRead; });

          const reconciled = merged.map((n) =>
            readMap[n.id] !== undefined ? { ...n, isRead: readMap[n.id] } : n
          );

          return {
            items:       reconciled,
            unreadCount: reconciled.filter((n) => !n.isRead).length,
          };
        });
      },

      /** Đánh dấu một thông báo đã đọc */
      markAsRead: (id) => {
        set((s) => {
          const items = s.items.map((n) => (n.id === id ? { ...n, isRead: true } : n));
          return { items, unreadCount: items.filter((n) => !n.isRead).length };
        });
      },

      /** Đánh dấu tất cả đã đọc */
      markAllAsRead: () => {
        set((s) => ({
          items:       s.items.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      },

      /** Xóa toàn bộ lịch sử (gọi khi đăng xuất) */
      reset: () => set({ items: [], unreadCount: 0 }),
    }),
    {
      name: 'notification-history',
      partialize: (s) => ({ items: s.items, unreadCount: s.unreadCount }),
    }
  )
);

export default useNotificationHistoryStore;

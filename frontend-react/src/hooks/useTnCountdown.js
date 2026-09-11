import { useEffect, useRef, useState } from 'react';

/**
 * Đồng hồ đếm ngược cho bài thi.
 * Nguồn sự thật là `thoiGianHanNop` từ server; `serverTime` để bù lệch giờ máy thí sinh.
 * Trả về số giây còn lại + cờ hết giờ; gọi onExpire() đúng 1 lần khi chạm 0.
 */
export default function useTnCountdown(thoiGianHanNop, serverTime, onExpire) {
  const offsetRef = useRef(0);          // (giờ máy client) - (giờ server), ms
  const firedRef = useRef(false);
  const [conLai, setConLai] = useState(null);

  useEffect(() => {
    if (!thoiGianHanNop) return;
    if (serverTime) offsetRef.current = Date.now() - new Date(serverTime).getTime();
    firedRef.current = false;

    const han = new Date(thoiGianHanNop).getTime();
    const tick = () => {
      const nowServer = Date.now() - offsetRef.current;
      const left = Math.max(0, Math.round((han - nowServer) / 1000));
      setConLai(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thoiGianHanNop, serverTime]);

  const hetGio = conLai !== null && conLai <= 0;
  return { conLai, hetGio, dinhDang: conLai == null ? '--:--' : fmt(conLai) };
}

function fmt(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
}

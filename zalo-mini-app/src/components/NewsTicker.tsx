import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Circle } from "lucide-react";
import { contentService } from "../services/api";

interface TickerItem {
  id: number;
  noiDung: string;
  duongDan?: string;
}

export default function NewsTicker() {
  const navigate = useNavigate();
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    contentService.getTicker()
      .then((res) => setItems(res.data?.data ?? []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  const handleClick = (item: TickerItem) => {
    if (!item.duongDan) return;
    if (/^https?:\/\//.test(item.duongDan)) {
      window.open(item.duongDan, "_blank");
    } else {
      navigate(item.duongDan);
    }
  };

  // Nhân đôi danh sách để cuộn liền mạch (loop vô hạn bằng CSS animation)
  const loopItems = [...items, ...items];

  return (
    <div className="news-ticker">
      <span className="news-ticker-label" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Circle size={8} fill="#ef4444" color="#ef4444" /> Tin mới
      </span>
      <div className="news-ticker-track-wrap">
        <div className="news-ticker-track">
          {loopItems.map((item, i) => (
            <span
              key={`${item.id}-${i}`}
              className="news-ticker-item"
              onClick={() => handleClick(item)}
              style={{ cursor: item.duongDan ? "pointer" : "default" }}
            >
              {item.noiDung}
              <span className="news-ticker-dot">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { contentService } from "../services/api";
import { imgUrl } from "../utils/url";

interface SliderItem {
  id: number;
  tieuDe: string;
  moTa?: string;
  hinhAnh: string;
  duongDan?: string;
}

export default function BannerSlider() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<SliderItem[]>([]);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    contentService.getSlider()
      .then((res) => setSlides(res.data?.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length]);

  if (slides.length === 0) return null;

  const handleClick = (item: SliderItem) => {
    if (!item.duongDan) return;
    if (/^https?:\/\//.test(item.duongDan)) {
      window.open(item.duongDan, "_blank");
    } else {
      navigate(item.duongDan);
    }
  };

  return (
    <div className="banner-slider">
      <div className="banner-slider-track">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className="banner-slide"
            style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0, cursor: s.duongDan ? "pointer" : "default" }}
            onClick={() => handleClick(s)}
          >
            <img
              src={imgUrl(s.hinhAnh)}
              alt={s.tieuDe}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="banner-slide-caption">
              <p className="banner-slide-title">{s.tieuDe}</p>
              {s.moTa && <p className="banner-slide-desc">{s.moTa}</p>}
            </div>
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="banner-slider-dots">
          {slides.map((_, i) => (
            <span key={i} className={`banner-dot ${i === current ? "active" : ""}`} onClick={() => setCurrent(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

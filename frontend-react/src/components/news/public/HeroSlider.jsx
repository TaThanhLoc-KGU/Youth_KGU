import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Hero image slider dùng cho trang chủ eNews.
 * Props:
 *   slides – Array<{ id, tieuDe, anhDaiDien, fullUrlPath, tomTat }>
 *   autoPlay – boolean (default true)
 *   interval – ms (default 5000)
 */
const HeroSlider = ({ slides = [], autoPlay = true, interval = 5000 }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const total = slides.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  // Auto-advance
  useEffect(() => {
    if (!autoPlay || paused || total < 2) return;
    timerRef.current = setInterval(next, interval);
    return () => clearInterval(timerRef.current);
  }, [autoPlay, paused, total, interval, next]);

  if (!total) return null;

  const slide = slides[current];

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl shadow-md"
      style={{ aspectRatio: '16/6' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          {s.anhDaiDien ? (
            <img
              src={s.anhDaiDien}
              alt={s.tieuDe}
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-enews-700 to-enews-900" />
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Caption */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            {s.chuyenMuc && (
              <span className="inline-block bg-enews-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full mb-2 uppercase tracking-wide">
                {s.chuyenMuc.ten}
              </span>
            )}
            <Link
              to={`/${s.fullUrlPath}`}
              className="block text-white font-bold text-base sm:text-xl md:text-2xl line-clamp-2 hover:underline leading-snug"
            >
              {s.tieuDe}
            </Link>
            {s.tomTat && (
              <p className="hidden sm:block text-white/80 text-sm mt-1 line-clamp-2">{s.tomTat}</p>
            )}
          </div>
        </div>
      ))}

      {/* Arrows */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
            aria-label="Trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
            aria-label="Sau"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`transition-all rounded-full ${
                i === current
                  ? 'bg-white w-6 h-2'
                  : 'bg-white/50 hover:bg-white/80 w-2 h-2'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;

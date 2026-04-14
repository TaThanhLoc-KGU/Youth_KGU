import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Scrolling news ticker / chạy chữ.
 * Props:
 *   posts – Array<{ id, tieuDe, fullUrlPath }> – items để hiển thị
 *   speed – px/s (default 60)
 */
const NewsTicker = ({ posts = [], speed = 60 }) => {
  const trackRef   = useRef(null);
  const [paused, setPaused] = useState(false);

  // Duplicate the list so we can loop seamlessly
  const items = [...posts, ...posts];

  useEffect(() => {
    const el = trackRef.current;
    if (!el || posts.length === 0) return;

    let animId;
    let x = 0;

    const step = () => {
      if (!paused) {
        x -= speed / 60; // ~60fps assumption
        const half = el.scrollWidth / 2;
        if (Math.abs(x) >= half) x = 0;
        el.style.transform = `translateX(${x}px)`;
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [paused, posts.length, speed]);

  if (!posts.length) return null;

  return (
    <div className="bg-enews-700 text-white flex items-center rounded-lg overflow-hidden shadow-sm my-4">
      {/* Scrolling track */}
      <div
        className="flex-1 overflow-hidden relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          ref={trackRef}
          className="flex whitespace-nowrap will-change-transform"
          style={{ display: 'inline-flex' }}
        >
          {items.map((post, idx) => (
            <span key={`${post.id}-${idx}`} className="inline-flex items-center">
              <Link
                to={`/${post.fullUrlPath}`}
                className="inline-block px-6 py-2 text-sm text-white/90 hover:text-white transition-colors"
              >
                {post.tieuDe}
              </Link>
              <span className="text-enews-400 select-none">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;

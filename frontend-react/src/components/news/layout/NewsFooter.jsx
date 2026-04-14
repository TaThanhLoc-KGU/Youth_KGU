import { Link } from 'react-router-dom';

const FacebookIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 7 10 7 10-7" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const NewsFooter = () => (
  <footer style={{ backgroundColor: '#0d3f52' }} className="text-gray-300 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">

        {/* Col 1: Brand */}
        <div>
          <Link to="/news" className="flex items-center gap-2.5 mb-3">
            <img
              src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
              alt="Logo Đoàn"
              className="w-10 h-10 object-contain"
            />
            <div className="leading-tight">
              <div className="text-white font-bold text-lg">Youth KGU</div>
              <div className="text-[11px] text-gray-400 -mt-0.5">Đoàn – Hội KGU</div>
            </div>
          </Link>
          <p className="text-sm leading-relaxed text-gray-400">
            Trang thông tin điện tử chính thức của Đoàn Thanh niên và Hội Sinh viên Trường Đại học Kiên Giang.
          </p>
          {/* Social icons */}
          <div className="flex items-center gap-2 mt-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <FacebookIcon />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
              aria-label="YouTube"
            >
              <YoutubeIcon />
            </a>
          </div>
        </div>

        {/* Col 2: Chuyên mục */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Chuyên mục</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/news" className="text-gray-400 hover:text-white transition-colors">
                Trang chủ
              </Link>
            </li>
            <li>
              <Link to="/news/doan-thanh-nien" className="text-gray-400 hover:text-white transition-colors">
                Đoàn Thanh niên
              </Link>
            </li>
            <li>
              <Link to="/news/hoi-sinh-vien" className="text-gray-400 hover:text-white transition-colors">
                Hội Sinh viên
              </Link>
            </li>
            <li>
              <Link to="/van-ban" className="text-gray-400 hover:text-white transition-colors">
                Văn bản – Kế hoạch
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Liên hệ */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Liên hệ</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2 text-gray-400">
              <MapPinIcon />
              <span>320A Quốc lộ 61, Xã Châu Thành, tỉnh An Giang</span>
            </li>
            <li className="flex items-start gap-2 text-gray-400">
              <MailIcon />
              <a
                href="mailto:doanthanhnien@vnkgu.edu.vn"
                className="hover:text-white transition-colors break-all"
              >
                doanthanhnien@vnkgu.edu.vn
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-gray-500">
        © 2026 Youth KGU – Đoàn Thanh niên – Hội Sinh viên Trường ĐH Kiên Giang
      </div>
    </div>
  </footer>
);

export default NewsFooter;

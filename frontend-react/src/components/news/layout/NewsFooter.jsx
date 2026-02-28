const NewsFooter = () => (
  <footer className="bg-gray-800 text-gray-300 mt-12">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <img
              src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
              alt="Logo Đoàn"
              className="w-8 h-8 object-contain"
            />
            <span className="text-white font-bold text-lg">Youth KGU</span>
          </div>
          <p className="text-sm leading-relaxed">
            Website chính thức của Đoàn Thanh niên – Hội Sinh viên<br />
            Trường Đại học Kiên Giang
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Liên kết nhanh</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/news" className="hover:text-white transition-colors">Trang chủ</a></li>
            <li><a href="/news/doan-thanh-nien" className="hover:text-white transition-colors">Đoàn Thanh niên</a></li>
            <li><a href="/news/hoi-sinh-vien" className="hover:text-white transition-colors">Hội Sinh viên</a></li>
            <li><a href="/news/van-ban" className="hover:text-white transition-colors">Văn bản – Kế hoạch</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Liên hệ</h4>
          <ul className="space-y-2 text-sm">
            <li>📍 Số 30, đường Lê Duẩn, TP. Rạch Giá, Kiên Giang</li>
            <li>📞 (0297) 3867 117</li>
            <li>✉️ doanhoikgu@kgu.edu.vn</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-700 mt-6 pt-6 text-center text-sm">
        © {new Date().getFullYear()} Đoàn Thanh niên – Hội Sinh viên Trường Đại học Kiên Giang
      </div>
    </div>
  </footer>
);

export default NewsFooter;

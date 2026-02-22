/**
 * Tiêu chí đánh giá điểm rèn luyện sinh viên theo quy chế trường KGU.
 * Cấu trúc cố định theo quy định – không tự ý thay đổi.
 *
 * Tổng điểm tối đa toàn bộ: 100 điểm (chưa tính điểm cộng mục VI)
 * Mục I  : 0-20  (học tập)
 * Mục II : 0-25  (chấp hành nội quy)
 * Mục III: 0-20  (hoạt động chính trị, xã hội, văn nghệ, thể thao)
 * Mục IV : 0-25  (ý thức công dân)
 * Mục V  : 0-10  (công tác cán bộ, thành tích)
 * Mục VI : 0-30  (điểm cộng ngoài khung)
 */
export const DIEM_REN_LUYEN_CRITERIA = [
  {
    id: 'I',
    danhMuc: 'Ý thức tham gia học tập',
    danhMucDayDu: 'ĐÁNH GIÁ VỀ Ý THỨC THAM GIA HỌC TẬP (0-20 điểm)',
    tongDiemToiDa: 20,
    tieuChi: [
      {
        id: '1.1',
        noiDung: 'Kết quả học tập trong học kỳ',
        diemToiDa: 20,
        chiTiet: [
          { id: '1.1.KHA',      noiDung: 'Khá',       diem: 10 },
          { id: '1.1.GIOI',     noiDung: 'Giỏi',      diem: 15 },
          { id: '1.1.XUAT_SAC', noiDung: 'Xuất sắc',  diem: 20 },
        ],
      },
      {
        id: '1.2',
        noiDung: 'Điểm trung bình học kỳ tăng so với học kỳ trước (SV học kỳ I năm 1 được tính)',
        diemToiDa: 5,
      },
      {
        id: '1.3',
        noiDung: 'Tham gia hoạt động học thuật, nghiên cứu khoa học (có minh chứng)',
        diemToiDa: 5,
      },
    ],
  },
  {
    id: 'II',
    danhMuc: 'Ý thức chấp hành nội quy, quy chế',
    danhMucDayDu: 'ĐÁNH GIÁ VỀ Ý THỨC CHẤP HÀNH CÁC NỘI QUY, QUY CHẾ, QUY ĐỊNH TRONG NHÀ TRƯỜNG (0-25 điểm)',
    tongDiemToiDa: 25,
    tieuChi: [
      {
        id: '2.1',
        noiDung: 'Không vi phạm nội quy, quy chế; đóng học phí đúng hạn; xác nhận học phần đúng tiến độ; tuân thủ quy chế thi (vi phạm trừ 5đ/lần)',
        diemToiDa: 15,
      },
      {
        id: '2.2',
        noiDung: 'Không vi phạm tệ nạn xã hội, an toàn giao thông, không hút thuốc',
        diemToiDa: 10,
      },
    ],
  },
  {
    id: 'III',
    danhMuc: 'Hoạt động chính trị xã hội, văn nghệ, thể thao',
    danhMucDayDu: 'ĐÁNH GIÁ VỀ Ý THỨC THAM GIA CÁC HOẠT ĐỘNG CHÍNH TRỊ XÃ HỘI, VĂN HÓA, VĂN NGHỆ, THỂ THAO, PHÒNG CHỐNG TỘI PHẠM VÀ CÁC TỆ NẠN XÃ HỘI (0-20 điểm)',
    tongDiemToiDa: 20,
    tieuChi: [
      {
        id: '3.1',
        noiDung: 'Tham gia hoạt động công ích, phòng chống tệ nạn, tình nguyện, mùa hè xanh, tiếp sức mùa thi (cộng 5đ/hoạt động có minh chứng)',
        diemToiDa: 10,
      },
      {
        id: '3.2',
        noiDung: 'Thành viên đội văn hóa, văn nghệ, thể thao, CLB cấp Khoa',
        diemToiDa: 5,
      },
      {
        id: '3.3',
        noiDung: 'Thành viên đội văn hóa, văn nghệ, thể thao, CLB cấp Trường',
        diemToiDa: 10,
      },
      {
        id: '3.4',
        noiDung: 'Tham gia, cổ vũ hoạt động do Khoa/Trường phát động; tham dự chương trình, hội nghị của Khoa/Trường (cộng 5đ hoặc 3đ/hoạt động có minh chứng)',
        diemToiDa: 15,
      },
    ],
  },
  {
    id: 'IV',
    danhMuc: 'Ý thức công dân trong quan hệ cộng đồng',
    danhMucDayDu: 'ĐÁNH GIÁ VỀ Ý THỨC CÔNG DÂN TRONG QUAN HỆ VỚI CỘNG ĐỒNG (0-25 điểm)',
    tongDiemToiDa: 25,
    tieuChi: [
      {
        id: '4.1',
        noiDung: 'Chấp hành chủ trương, đường lối Đảng, pháp luật Nhà nước; tham gia bảo hiểm y tế theo quy định',
        diemToiDa: 15,
      },
      {
        id: '4.2',
        noiDung: 'Hòa đồng, nhiệt tình giúp đỡ bạn bè; xây dựng đoàn kết, không gây mất đoàn kết nội bộ',
        diemToiDa: 3,
      },
      {
        id: '4.3',
        noiDung: 'Tham gia hoạt động cộng đồng tại địa phương (có minh chứng trong học kỳ)',
        diemToiDa: 2,
      },
      {
        id: '4.4',
        noiDung: 'Tham gia hiến máu nhân đạo (có giấy chứng nhận)',
        diemToiDa: 5,
      },
    ],
  },
  {
    id: 'V',
    danhMuc: 'Công tác cán bộ lớp, đoàn thể, thành tích đặc biệt',
    danhMucDayDu: 'ĐÁNH GIÁ VỀ Ý THỨC VÀ KẾT QUẢ KHI THAM GIA CÔNG TÁC CÁN BỘ LỚP, CÁC ĐOÀN THỂ, TỔ CHỨC TRONG NHÀ TRƯỜNG HOẶC ĐẠT THÀNH TÍCH ĐẶC BIỆT (0-10 điểm)',
    tongDiemToiDa: 10,
    tieuChi: [
      {
        id: '5.1',
        noiDung: 'Là ban cán sự lớp/lớp học phần; Thành viên BCH Đoàn-Hội, Đội TNXK hoàn thành nhiệm vụ; Thành viên Ban Chủ nhiệm CLB',
        diemToiDa: 5,
      },
      {
        id: '5.2',
        noiDung: 'Tham gia đầy đủ các buổi sinh hoạt lớp',
        diemToiDa: 5,
      },
    ],
  },
  {
    id: 'VI',
    danhMuc: 'Điểm cộng ngoài khung',
    danhMucDayDu: 'ĐIỂM CỘNG NGOÀI KHUNG (0-30 điểm)',
    tongDiemToiDa: 30,
    tieuChi: [
      {
        id: '6.1',
        noiDung: 'Đạt giải khuyến khích trở lên trong hoạt động học thuật, NCKH, văn hóa, văn nghệ, TDTT từ cấp Trường trở lên (có minh chứng)',
        diemToiDa: 10,
      },
      {
        id: '6.2',
        noiDung: 'Đạt danh hiệu "Sinh viên 5 tốt" cấp Trường trở lên (có Quyết định)',
        diemToiDa: 10,
      },
      {
        id: '6.3',
        noiDung: 'Có thành tích tiêu biểu xuất sắc (SV tự minh chứng; điểm chính thức do hội đồng cấp trường quyết định)',
        diemToiDa: 10,
      },
    ],
  },
];

/** Lookup nhanh một tiêu chí theo id (VD: "3.4") */
export function findTieuChi(tieuChiId) {
  for (const dm of DIEM_REN_LUYEN_CRITERIA) {
    const found = dm.tieuChi.find((tc) => tc.id === tieuChiId);
    if (found) return { ...found, danhMucId: dm.id, danhMuc: dm.danhMuc, tongDiemToiDa: dm.tongDiemToiDa };
  }
  return null;
}

/** Lookup danh mục theo id (VD: "III") */
export function findDanhMuc(danhMucId) {
  return DIEM_REN_LUYEN_CRITERIA.find((dm) => dm.id === danhMucId) || null;
}

/** Lấy diemToiDa của tiêu chí */
export function getDiemToiDa(tieuChiId) {
  const tc = findTieuChi(tieuChiId);
  return tc ? tc.diemToiDa : 0;
}

/** Label ngắn gọn cho badge */
export function getTieuChiLabel(tieuChiId) {
  const tc = findTieuChi(tieuChiId);
  return tc ? `${tieuChiId} – ${tc.noiDung.substring(0, 50)}...` : tieuChiId;
}

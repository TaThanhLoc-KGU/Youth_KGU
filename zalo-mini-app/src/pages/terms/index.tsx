import React from "react";
import { Header, Page } from "zmp-ui";

const UPDATED_AT = "18/07/2026";

export default function TermsPage() {
  return (
    <Page>
      <Header title="Điều khoản sử dụng" showBackIcon />
      <div className="page-content">
        <div className="card">
          <div className="card-body" style={{ fontSize: 13.5, lineHeight: 1.75, color: "var(--text)" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
              Cập nhật lần cuối: {UPDATED_AT}
            </p>

            <Section title="1. Giới thiệu">
              Youth KGU (bao gồm Mini App trên Zalo và website tuoitre.vnkgu.edu.vn) là nền tảng chính thức của
              Đoàn Thanh niên – Hội Sinh viên Trường Đại học Kiên Giang, phục vụ đoàn viên, sinh viên trong việc
              theo dõi tin tức, đăng ký và điểm danh hoạt động, tra cứu điểm rèn luyện, tham gia câu lạc bộ,
              bình chọn/cuộc thi và các dịch vụ liên quan. Khi truy cập hoặc sử dụng Youth KGU, bạn đồng ý với
              các điều khoản dưới đây.
            </Section>

            <Section title="2. Tài khoản người dùng">
              <ul style={{ paddingLeft: 18, listStyle: "disc" }}>
                <li>Tài khoản gắn với mã số sinh viên/đoàn viên hoặc được cấp bởi nhà trường/Đoàn trường.</li>
                <li>Bạn có thể đăng nhập bằng tài khoản/mật khẩu hoặc liên kết tài khoản Zalo cá nhân.</li>
                <li>
                  Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình và các hoạt động thực hiện dưới
                  tài khoản đó. Vui lòng thông báo ngay cho Đoàn trường nếu phát hiện truy cập trái phép.
                </li>
                <li>Thông tin cá nhân (họ tên, mã số, lớp/khoa...) cần chính xác và được cập nhật đầy đủ.</li>
              </ul>
            </Section>

            <Section title="3. Quy định khi sử dụng dịch vụ">
              <ul style={{ paddingLeft: 18, listStyle: "disc" }}>
                <li><b>Đăng ký hoạt động:</b> đăng ký đúng thông tin cá nhân, tham gia đúng hoạt động đã đăng ký.</li>
                <li><b>Điểm danh QR:</b> mã QR chỉ dùng để tự điểm danh cho chính bạn tại đúng thời gian, địa điểm của hoạt động; không chia sẻ mã QR/thông tin đăng nhập cho người khác điểm danh hộ.</li>
                <li><b>Điểm rèn luyện:</b> số liệu được tổng hợp tự động từ hoạt động đã tham gia và có xác nhận của BCH/nhà trường theo quy chế đánh giá rèn luyện hiện hành.</li>
                <li><b>Câu lạc bộ, cuộc thi, bình chọn:</b> tuân thủ thể lệ riêng của từng CLB/cuộc thi do đơn vị tổ chức công bố.</li>
                <li>Không sử dụng Youth KGU để đăng tải nội dung sai sự thật, xúc phạm, vi phạm pháp luật hoặc nội quy nhà trường.</li>
                <li>Không can thiệp, khai thác lỗ hổng kỹ thuật hoặc cố ý gây gián đoạn hệ thống.</li>
              </ul>
            </Section>

            <Section title="4. Thông báo qua Zalo">
              Nếu bạn liên kết tài khoản Zalo, Youth KGU có thể gửi thông báo về hoạt động, tin tức liên quan
              qua Official Account của Đoàn trường. Bạn có thể huỷ liên kết hoặc chặn Official Account bất kỳ
              lúc nào; việc này có thể ảnh hưởng đến khả năng nhận thông báo và đăng nhập nhanh bằng Zalo.
            </Section>

            <Section title="5. Dữ liệu cá nhân">
              Thông tin cá nhân bạn cung cấp (họ tên, mã số, lớp/khoa, số điện thoại, dữ liệu điểm danh, vị trí
              khi điểm danh...) chỉ được sử dụng để vận hành các chức năng của Youth KGU: xác thực tài khoản,
              quản lý đăng ký/điểm danh hoạt động, tính điểm rèn luyện và liên lạc khi cần thiết. Dữ liệu không
              được chia sẻ cho bên thứ ba ngoài mục đích trên, trừ khi có yêu cầu của cơ quan nhà nước có thẩm quyền.
            </Section>

            <Section title="6. Sở hữu nội dung">
              Toàn bộ tin tức, hình ảnh, văn bản, biểu mẫu đăng tải trên Youth KGU thuộc quyền quản lý của Đoàn
              Thanh niên – Hội Sinh viên Trường Đại học Kiên Giang, chỉ dùng cho mục đích thông tin nội bộ và học
              tập; không sao chép, phát tán vì mục đích thương mại khi chưa được phép.
            </Section>

            <Section title="7. Giới hạn trách nhiệm">
              Youth KGU được cung cấp trên nguyên tắc "hiện có". Chúng tôi nỗ lực đảm bảo hệ thống hoạt động ổn
              định nhưng không đảm bảo tuyệt đối không gián đoạn, lỗi kỹ thuật hoặc sai sót dữ liệu. Trong
              trường hợp có sự cố ảnh hưởng đến việc đăng ký/điểm danh hoạt động, vui lòng liên hệ trực tiếp
              BCH/Đoàn trường để được hỗ trợ xử lý.
            </Section>

            <Section title="8. Thay đổi điều khoản">
              Điều khoản sử dụng có thể được cập nhật để phù hợp với quy định mới hoặc thay đổi tính năng. Phiên
              bản mới nhất luôn được hiển thị tại trang này; việc tiếp tục sử dụng Youth KGU sau khi điều khoản
              thay đổi đồng nghĩa bạn chấp nhận nội dung cập nhật.
            </Section>

            <Section title="9. Liên hệ">
              Mọi thắc mắc về điều khoản sử dụng, vui lòng liên hệ Đoàn Thanh niên – Hội Sinh viên Trường Đại
              học Kiên Giang qua website{" "}
              <a href="https://tuoitre.vnkgu.edu.vn" style={{ color: "var(--primary)", fontWeight: 600 }}>
                tuoitre.vnkgu.edu.vn
              </a>{" "}
              hoặc Official Account Zalo của Đoàn trường.
            </Section>
          </div>
        </div>
      </div>
    </Page>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: "var(--primary)" }}>{title}</p>
      <div>{children}</div>
    </div>
  );
}

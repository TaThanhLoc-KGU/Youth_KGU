package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.Repository.TaiKhoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.Normalizer;

/**
 * Service tự động sinh username từ họ tên theo quy tắc viết tắt:
 *   - Lấy chữ cái đầu (không dấu, thường) của mỗi từ, TRỪ từ cuối
 *   - Từ cuối giữ nguyên toàn bộ (không dấu, thường)
 *   - Ví dụ: "Tạ Thành Lộc"       → ttloc
 *            "Trần Ngọc Vĩnh Nhơn" → tnvnhon
 *   - Nếu trùng username → thêm số đuôi: ttloc2, ttloc3, ...
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UsernameGeneratorService {

    private final TaiKhoanRepository taiKhoanRepository;

    /**
     * Sinh username viết tắt từ họ tên, tự động xử lý trùng.
     *
     * @param hoTen Họ tên đầy đủ (VD: "Tạ Thành Lộc")
     * @return Username hợp lệ, chưa tồn tại trong hệ thống
     */
    public String generate(String hoTen) {
        String base = buildBase(hoTen);
        if (base.isBlank()) {
            base = "user";
        }

        // Kiểm tra trùng và thêm số đuôi nếu cần
        if (!taiKhoanRepository.existsByUsername(base)) {
            return base;
        }

        int suffix = 2;
        while (true) {
            String candidate = base + suffix;
            if (!taiKhoanRepository.existsByUsername(candidate)) {
                log.debug("Username '{}' trùng, dùng '{}'", base, candidate);
                return candidate;
            }
            suffix++;
        }
    }

    /**
     * Chỉ tạo chuỗi viết tắt, KHÔNG kiểm tra trùng.
     * Dùng để gợi ý trên UI.
     */
    public String buildBase(String hoTen) {
        if (hoTen == null || hoTen.isBlank()) return "";

        String[] words = hoTen.trim().split("\\s+");
        if (words.length == 0) return "";

        StringBuilder sb = new StringBuilder();

        // Chữ đầu của mỗi từ trừ từ cuối
        for (int i = 0; i < words.length - 1; i++) {
            String w = removeVietnameseDiacritics(words[i]);
            if (!w.isBlank()) {
                sb.append(w.charAt(0));
            }
        }

        // Từ cuối giữ nguyên (không dấu, thường)
        String lastWord = removeVietnameseDiacritics(words[words.length - 1]);
        sb.append(lastWord);

        return sb.toString().toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    /**
     * Xóa dấu tiếng Việt, trả về chuỗi thuần ASCII thường.
     */
    public static String removeVietnameseDiacritics(String s) {
        if (s == null) return "";
        // Xử lý đ/Đ trước (NFD không tách được)
        String r = s.replace("đ", "d").replace("Đ", "D");
        r = Normalizer.normalize(r, Normalizer.Form.NFD);
        r = r.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return r.toLowerCase();
    }
}

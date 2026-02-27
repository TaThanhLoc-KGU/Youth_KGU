package com.tathanhloc.youthkgu.Service;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Tiện ích sinh slug tiếng Việt — chuyển đổi ký tự có dấu sang Latin không dấu.
 */
@Service
public class SlugService {

    private static final Map<Character, String> CHAR_MAP = new LinkedHashMap<>();

    static {
        "àáạảãâầấậẩẫăằắặẳẵ".chars().forEach(c -> CHAR_MAP.put((char) c, "a"));
        "ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ".chars().forEach(c -> CHAR_MAP.put((char) c, "a"));
        "èéẹẻẽêềếệểễ".chars().forEach(c -> CHAR_MAP.put((char) c, "e"));
        "ÈÉẸẺẼÊỀẾỆỂỄ".chars().forEach(c -> CHAR_MAP.put((char) c, "e"));
        "ìíịỉĩ".chars().forEach(c -> CHAR_MAP.put((char) c, "i"));
        "ÌÍỊỈĨ".chars().forEach(c -> CHAR_MAP.put((char) c, "i"));
        "òóọỏõôồốộổỗơờớợởỡ".chars().forEach(c -> CHAR_MAP.put((char) c, "o"));
        "ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ".chars().forEach(c -> CHAR_MAP.put((char) c, "o"));
        "ùúụủũưừứựửữ".chars().forEach(c -> CHAR_MAP.put((char) c, "u"));
        "ÙÚỤỦŨƯỪỨỰỬỮ".chars().forEach(c -> CHAR_MAP.put((char) c, "u"));
        "ỳýỵỷỹ".chars().forEach(c -> CHAR_MAP.put((char) c, "y"));
        "ỲÝỴỶỸ".chars().forEach(c -> CHAR_MAP.put((char) c, "y"));
        CHAR_MAP.put('đ', "d");
        CHAR_MAP.put('Đ', "d");
    }

    /**
     * Chuyển chuỗi tiếng Việt thành slug (lowercase, không dấu, phân cách bằng dấu gạch ngang).
     */
    public String toSlug(String input) {
        if (input == null || input.isBlank()) return "";
        StringBuilder sb = new StringBuilder();
        for (char c : input.toCharArray()) {
            String mapped = CHAR_MAP.get(c);
            sb.append(mapped != null ? mapped : c);
        }
        return sb.toString()
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    /**
     * Rút gọn slug nếu quá dài (max maxLen ký tự), cắt tại word boundary.
     */
    public String truncateSlug(String slug, int maxLen) {
        if (slug == null || slug.length() <= maxLen) return slug;
        String truncated = slug.substring(0, maxLen);
        int lastDash = truncated.lastIndexOf('-');
        return lastDash > 20 ? truncated.substring(0, lastDash) : truncated;
    }

    /**
     * Đảm bảo slug unique bằng cách thêm -2, -3... cho đến khi không trùng.
     *
     * @param baseSlug   slug gốc
     * @param existsCheck hàm kiểm tra slug đã tồn tại chưa (return true = đã tồn tại)
     */
    public String ensureUnique(String baseSlug, Function<String, Boolean> existsCheck) {
        String candidate = baseSlug;
        int counter = 2;
        while (Boolean.TRUE.equals(existsCheck.apply(candidate))) {
            candidate = baseSlug + "-" + counter++;
        }
        return candidate;
    }
}

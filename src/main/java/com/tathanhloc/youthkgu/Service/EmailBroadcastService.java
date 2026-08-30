package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.EmailBroadcastRequest;
import com.tathanhloc.youthkgu.DTO.EmailBroadcastResultDTO;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Model.EmailGroup;
import com.tathanhloc.youthkgu.Repository.EmailGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Gửi email hàng loạt tới các nhóm mail đã lưu (EmailGroup) và/hoặc địa chỉ gõ tay thêm.
 * CHỈ gửi khi người dùng chủ động bấm nút gửi (POST /api/email-broadcast/send) — không có
 * bất kỳ trigger tự động nào, đúng tinh thần đã thống nhất cho toàn bộ tính năng email/thông
 * báo trong hệ thống (xem HoatDongService.publishActivity()).
 * <p>
 * Số lượng người nhận ở đây là số NHÓM MAIL (tối đa vài chục), không phải số sinh viên —
 * nên chạy đồng bộ (không @Async) để trả kết quả gửi thành công/thất bại ngay cho người dùng.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EmailBroadcastService {

    private static final java.util.regex.Pattern EMAIL_PATTERN =
            java.util.regex.Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final EmailGroupRepository emailGroupRepository;
    private final EmailService emailService;

    public EmailBroadcastResultDTO send(EmailBroadcastRequest req) {
        if (req.getSubject() == null || req.getSubject().isBlank()) {
            throw new BusinessException("TIEU_DE_TRONG", "Vui lòng nhập tiêu đề email");
        }
        if (req.getBody() == null || req.getBody().isBlank()) {
            throw new BusinessException("NOI_DUNG_TRONG", "Vui lòng nhập nội dung email");
        }

        Set<String> recipients = new LinkedHashSet<>();

        if (req.getGroupIds() != null && !req.getGroupIds().isEmpty()) {
            List<EmailGroup> groups = emailGroupRepository.findAllById(req.getGroupIds());
            for (EmailGroup g : groups) {
                if (Boolean.FALSE.equals(g.getIsActive())) continue;
                recipients.add(g.getDiaChiEmail().trim());
            }
        }

        if (req.getExtraEmails() != null) {
            for (String raw : req.getExtraEmails()) {
                if (raw == null) continue;
                String email = raw.trim();
                if (email.isEmpty()) continue;
                if (!EMAIL_PATTERN.matcher(email).matches()) {
                    throw new BusinessException("DIA_CHI_KHONG_HOP_LE", "Địa chỉ email không hợp lệ: " + email);
                }
                recipients.add(email);
            }
        }

        if (recipients.isEmpty()) {
            throw new BusinessException("CHUA_CHON_NGUOI_NHAN", "Vui lòng chọn ít nhất 1 nhóm mail hoặc nhập 1 địa chỉ email");
        }

        int success = 0;
        List<String> failed = new ArrayList<>();
        for (String to : recipients) {
            boolean ok = emailService.sendCustomEmail(to, req.getSubject().trim(), req.getBody());
            if (ok) success++; else failed.add(to);
        }

        log.info("Gửi email hàng loạt: {}/{} thành công, tiêu đề \"{}\"", success, recipients.size(), req.getSubject());

        return EmailBroadcastResultDTO.builder()
                .tongSoNguoiNhan(recipients.size())
                .guiThanhCong(success)
                .guiThatBai(failed.size())
                .diaChiThatBai(failed)
                .build();
    }
}

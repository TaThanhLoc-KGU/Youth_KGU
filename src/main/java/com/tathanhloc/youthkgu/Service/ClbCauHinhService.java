package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.ClbCauHinhDTO;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.CauLacBo;
import com.tathanhloc.youthkgu.Model.ClbCauHinh;
import com.tathanhloc.youthkgu.Repository.CauLacBoRepository;
import com.tathanhloc.youthkgu.Repository.ClbCauHinhRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClbCauHinhService {

    // ── REPOSITORY ──────────────────────────────────────────────
    private final ClbCauHinhRepository repo;
    private final CauLacBoRepository clbRepo;

    // ── GET ─────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ClbCauHinhDTO getByCLB(String maClb) {
        ClbCauHinh cfg = repo.findById(maClb).orElse(null);
        if (cfg == null) {
            // Trả về default config nếu chưa thiết lập
            CauLacBo clb = clbRepo.findById(maClb)
                    .orElseThrow(() -> new ResourceNotFoundException("CLB không tồn tại: " + maClb));
            return defaultDTO(clb);
        }
        return toDTO(cfg);
    }

    // ── SAVE (upsert) ────────────────────────────────────────────
    @Transactional
    public ClbCauHinhDTO save(String maClb, ClbCauHinhDTO dto, String updatedBy) {
        CauLacBo clb = clbRepo.findById(maClb)
                .orElseThrow(() -> new ResourceNotFoundException("CLB không tồn tại: " + maClb));

        ClbCauHinh cfg = repo.findById(maClb).orElseGet(() -> {
            log.info("Tạo mới cấu hình cho CLB {}", maClb);
            ClbCauHinh newCfg = new ClbCauHinh();
            newCfg.setCauLacBo(clb);
            // maClb sẽ được Hibernate tự động đồng bộ từ clb qua @MapsId
            return newCfg;
        });

        cfg.setCocheThanHVien(dto.getCocheThanHVien() != null ? dto.getCocheThanHVien() : "TU_DO");
        cfg.setSoHoatDongToiThieu(dto.getSoHoatDongToiThieu());
        cfg.setSoTienPhiKy(dto.getSoTienPhiKy());
        cfg.setDonViPhi(dto.getDonViPhi() != null ? dto.getDonViPhi() : "KY");
        cfg.setChoPhepDangKyTuDo(dto.getChoPhepDangKyTuDo() != null ? dto.getChoPhepDangKyTuDo() : true);
        cfg.setCanDuyetDangKy(dto.getCanDuyetDangKy() != null ? dto.getCanDuyetDangKy() : true);
        cfg.setSoThanhVienToiDa(dto.getSoThanhVienToiDa());
        cfg.setBankAccountNo(dto.getBankAccountNo());
        cfg.setBankName(dto.getBankName());
        cfg.setAccountName(dto.getAccountName());
        cfg.setMaXacThucCk(dto.getMaXacThucCk());
        cfg.setWebhookSecret(dto.getWebhookSecret());
        cfg.setWebhookProvider(dto.getWebhookProvider() != null ? dto.getWebhookProvider() : "CASSO");
        cfg.setPayosClientId(dto.getPayosClientId());
        cfg.setPayosApiKey(dto.getPayosApiKey());
        cfg.setPayosChecksumKey(dto.getPayosChecksumKey());
        cfg.setMoTaYeuCau(dto.getMoTaYeuCau());
        cfg.setUpdatedBy(updatedBy);

        // repo.save(cfg) sẽ gọi persist nếu là mới (vì ID ban đầu null) hoặc merge nếu đã có.
        // Tuy nhiên với @MapsId, Hibernate sẽ xử lý việc gán ID từ clb.
        ClbCauHinh saved = repo.save(cfg);
        log.info("Đã lưu cấu hình CLB {} bởi {}", maClb, updatedBy);
        return toDTO(saved);
    }

    // ── MAPPER ──────────────────────────────────────────────────
    private ClbCauHinhDTO toDTO(ClbCauHinh c) {
        return ClbCauHinhDTO.builder()
                .maClb(c.getMaClb())
                .tenClb(c.getCauLacBo() != null ? c.getCauLacBo().getTenClb() : null)
                .cocheThanHVien(c.getCocheThanHVien())
                .soHoatDongToiThieu(c.getSoHoatDongToiThieu())
                .soTienPhiKy(c.getSoTienPhiKy())
                .donViPhi(c.getDonViPhi())
                .choPhepDangKyTuDo(c.getChoPhepDangKyTuDo())
                .canDuyetDangKy(c.getCanDuyetDangKy())
                .soThanhVienToiDa(c.getSoThanhVienToiDa())
                .bankAccountNo(c.getBankAccountNo())
                .bankName(c.getBankName())
                .accountName(c.getAccountName())
                .maXacThucCk(c.getMaXacThucCk())
                .webhookSecret(c.getWebhookSecret())
                .webhookProvider(c.getWebhookProvider())
                .payosClientId(c.getPayosClientId())
                .payosApiKey(c.getPayosApiKey())
                .payosChecksumKey(c.getPayosChecksumKey())
                .moTaYeuCau(c.getMoTaYeuCau())
                .build();
    }

    private ClbCauHinhDTO defaultDTO(CauLacBo clb) {
        return ClbCauHinhDTO.builder()
                .maClb(clb.getMaClb())
                .tenClb(clb.getTenClb())
                .cocheThanHVien("TU_DO")
                .soTienPhiKy(java.math.BigDecimal.valueOf(50000))
                .donViPhi("KY")
                .choPhepDangKyTuDo(true)
                .canDuyetDangKy(true)
                .webhookProvider("CASSO")
                .build();
    }
}

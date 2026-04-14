package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.VoteRequest;
import com.tathanhloc.youthkgu.Enum.*;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BinhChonService {

    private final CuocThiRepository cuocThiRepository;
    private final ThiSinhRepository thiSinhRepository;
    private final LuotBinhChonRepository luotBinhChonRepository;
    private final DiemDanhHoatDongRepository diemDanhRepository;

    /**
     * Thực hiện vote. Trả về map kết quả gồm trạng thái và thông tin thí sinh sau vote.
     */
    @Transactional
    public Map<String, Object> vote(VoteRequest req, String nguoiVoteMa, String ip) {
        CuocThi ct = cuocThiRepository.findById(req.getCuocThiId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc thi"));

        ThiSinh ts = thiSinhRepository.findById(req.getThiSinhId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thí sinh"));

        if (!ts.getCuocThi().getId().equals(ct.getId())) {
            throw new RuntimeException("Thí sinh không thuộc cuộc thi này");
        }

        // Kiểm tra trạng thái cuộc thi
        if (ct.getTrangThai() != TrangThaiCuocThiEnum.DANG_MO) {
            throw new RuntimeException("Cuộc thi chưa mở bình chọn hoặc đã đóng");
        }

        // Kiểm tra thời gian
        LocalDateTime now = LocalDateTime.now();
        if (ct.getThoiGianMoVote() != null && now.isBefore(ct.getThoiGianMoVote())) {
            throw new RuntimeException("Chưa đến thời gian bình chọn");
        }
        if (ct.getThoiGianDongVote() != null && now.isAfter(ct.getThoiGianDongVote())) {
            throw new RuntimeException("Đã hết thời gian bình chọn");
        }

        // Kiểm tra điều kiện
        checkEligibility(ct, nguoiVoteMa, ip, req.getDeviceId());

        // Lưu vote
        LuotBinhChon lbc = LuotBinhChon.builder()
                .thiSinh(ts)
                .cuocThi(ct)
                .nguoiVoteMa(nguoiVoteMa)
                .nguoiVoteIp(ip)
                .nguoiVoteDeviceId(req.getDeviceId())
                .ngayVote(LocalDate.now())
                .build();
        luotBinhChonRepository.save(lbc);

        // Increment soVote (atomic)
        thiSinhRepository.incrementVote(ts.getId());

        log.info("Vote thành công: cuocThi={}, thiSinh={}, nguoi={}", ct.getId(), ts.getId(), nguoiVoteMa);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Bình chọn thành công!");
        result.put("thiSinhId", ts.getId());
        result.put("thiSinhTen", ts.getTen());
        return result;
    }

    private void checkEligibility(CuocThi ct, String nguoiVoteMa, String ip, String deviceId) {
        Long cuocThiId = ct.getId();

        // Kiểm tra điều kiện đăng nhập
        if (ct.getDieuKienVote() == DieuKienVoteEnum.DANG_NHAP && (nguoiVoteMa == null || nguoiVoteMa.isBlank())) {
            throw new RuntimeException("Bạn cần đăng nhập để bình chọn");
        }
        if (ct.getDieuKienVote() == DieuKienVoteEnum.CHECK_IN) {
            if (nguoiVoteMa == null || nguoiVoteMa.isBlank()) {
                throw new RuntimeException("Bạn cần đăng nhập để bình chọn");
            }
            if (ct.getHoatDong() == null) {
                throw new RuntimeException("Cuộc thi không gắn với hoạt động nào");
            }
            String maHoatDong = ct.getHoatDong().getMaHoatDong();
            boolean daCheckIn = diemDanhRepository.existsBySinhVienMaSvAndHoatDongMaHoatDong(nguoiVoteMa, maHoatDong);
            if (!daCheckIn) {
                throw new RuntimeException("Bạn cần check-in hoạt động này để bình chọn");
            }
        }

        // Kiểm tra quy tắc vote
        LocalDate today = LocalDate.now();
        boolean daDangNhap = nguoiVoteMa != null && !nguoiVoteMa.isBlank();

        if (ct.getQuyTacVote() == QuyTacVoteEnum.MOT_LAN) {
            if (daDangNhap) {
                if (luotBinhChonRepository.existsByCuocThiIdAndNguoiVoteMa(cuocThiId, nguoiVoteMa)) {
                    throw new RuntimeException("Bạn đã bình chọn rồi, mỗi người chỉ được bình chọn 1 lần");
                }
            } else if (ip != null) {
                if (luotBinhChonRepository.existsByCuocThiIdAndNguoiVoteIp(cuocThiId, ip)) {
                    throw new RuntimeException("Địa chỉ IP này đã bình chọn rồi");
                }
            }
        } else if (ct.getQuyTacVote() == QuyTacVoteEnum.MOI_NGAY) {
            if (daDangNhap) {
                if (luotBinhChonRepository.existsByCuocThiIdAndNguoiVoteMaAndNgayVote(cuocThiId, nguoiVoteMa, today)) {
                    throw new RuntimeException("Bạn đã bình chọn hôm nay rồi, hãy quay lại ngày mai");
                }
            } else if (ip != null) {
                if (luotBinhChonRepository.existsByCuocThiIdAndNguoiVoteIpAndNgayVote(cuocThiId, ip, today)) {
                    throw new RuntimeException("IP này đã bình chọn hôm nay rồi");
                }
            }
        } else if (ct.getQuyTacVote() == QuyTacVoteEnum.N_LUOT) {
            int max = ct.getSoLuotToiDa() != null ? ct.getSoLuotToiDa() : 1;
            long soLuotDaVote;
            if (daDangNhap) {
                soLuotDaVote = luotBinhChonRepository.countByCuocThiIdAndNguoiVoteMa(cuocThiId, nguoiVoteMa);
            } else {
                soLuotDaVote = ip != null ? luotBinhChonRepository.countByCuocThiIdAndNguoiVoteIp(cuocThiId, ip) : 0;
            }
            if (soLuotDaVote >= max) {
                throw new RuntimeException("Bạn đã dùng hết " + max + " lượt bình chọn");
            }
        }
    }

    /**
     * Kiểm tra trạng thái vote của user/IP trong cuộc thi.
     */
    public Map<String, Object> kiemTraVote(Long cuocThiId, String nguoiVoteMa, String ip) {
        CuocThi ct = cuocThiRepository.findById(cuocThiId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc thi"));

        boolean daVote = false;
        long soLuotDaVote = 0;
        int soLuotToiDa = ct.getSoLuotToiDa() != null ? ct.getSoLuotToiDa() : 1;

        boolean daDangNhap = nguoiVoteMa != null && !nguoiVoteMa.isBlank();
        LocalDate today = LocalDate.now();

        if (ct.getQuyTacVote() == QuyTacVoteEnum.MOT_LAN) {
            if (daDangNhap) daVote = luotBinhChonRepository.existsByCuocThiIdAndNguoiVoteMa(cuocThiId, nguoiVoteMa);
            else if (ip != null) daVote = luotBinhChonRepository.existsByCuocThiIdAndNguoiVoteIp(cuocThiId, ip);
        } else if (ct.getQuyTacVote() == QuyTacVoteEnum.MOI_NGAY) {
            if (daDangNhap) daVote = luotBinhChonRepository.existsByCuocThiIdAndNguoiVoteMaAndNgayVote(cuocThiId, nguoiVoteMa, today);
            else if (ip != null) daVote = luotBinhChonRepository.existsByCuocThiIdAndNguoiVoteIpAndNgayVote(cuocThiId, ip, today);
        } else if (ct.getQuyTacVote() == QuyTacVoteEnum.N_LUOT) {
            if (daDangNhap) soLuotDaVote = luotBinhChonRepository.countByCuocThiIdAndNguoiVoteMa(cuocThiId, nguoiVoteMa);
            else if (ip != null) soLuotDaVote = luotBinhChonRepository.countByCuocThiIdAndNguoiVoteIp(cuocThiId, ip);
            daVote = soLuotDaVote >= soLuotToiDa;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("daVote", daVote);
        result.put("soLuotDaVote", soLuotDaVote);
        result.put("soLuotToiDa", soLuotToiDa);
        result.put("quyTacVote", ct.getQuyTacVote().name());
        result.put("conLuot", Math.max(0, soLuotToiDa - soLuotDaVote));
        return result;
    }
}

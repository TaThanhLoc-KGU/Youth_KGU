package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.LuotBinhChon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LuotBinhChonRepository extends JpaRepository<LuotBinhChon, Long> {

    // Tổng số vote của 1 người trong 1 cuộc thi (cho N_LUOT)
    long countByCuocThiIdAndNguoiVoteMa(Long cuocThiId, String nguoiVoteMa);

    // Kiểm tra đã vote hôm nay chưa (cho MOI_NGAY)
    boolean existsByCuocThiIdAndNguoiVoteMaAndNgayVote(Long cuocThiId, String nguoiVoteMa, LocalDate ngayVote);

    // Kiểm tra đã vote cuộc thi này chưa (cho MOT_LAN, người đã đăng nhập)
    boolean existsByCuocThiIdAndNguoiVoteMa(Long cuocThiId, String nguoiVoteMa);

    // Kiểm tra IP đã vote hôm nay chưa (anonymous, MOI_NGAY)
    boolean existsByCuocThiIdAndNguoiVoteIpAndNgayVote(Long cuocThiId, String ip, LocalDate ngayVote);

    // Kiểm tra IP đã vote chưa (anonymous, MOT_LAN)
    boolean existsByCuocThiIdAndNguoiVoteIp(Long cuocThiId, String ip);

    // Số lần vote của IP trong cuộc thi (anonymous, N_LUOT)
    long countByCuocThiIdAndNguoiVoteIp(Long cuocThiId, String ip);

    // Kết quả vote từng thí sinh
    @Query("SELECT lbc.thiSinh.id, COUNT(lbc) FROM LuotBinhChon lbc WHERE lbc.cuocThi.id = :cuocThiId GROUP BY lbc.thiSinh.id")
    List<Object[]> countVoteGroupByThiSinh(@Param("cuocThiId") Long cuocThiId);

    // Lịch sử vote của 1 người
    List<LuotBinhChon> findByCuocThiIdAndNguoiVoteMaOrderByCreatedAtDesc(Long cuocThiId, String nguoiVoteMa);

    // Tổng vote toàn cuộc thi
    long countByCuocThiId(Long cuocThiId);

    // Vote theo ngày (cho biểu đồ trend)
    @Query("SELECT lbc.ngayVote, COUNT(lbc) FROM LuotBinhChon lbc WHERE lbc.cuocThi.id = :cuocThiId GROUP BY lbc.ngayVote ORDER BY lbc.ngayVote")
    List<Object[]> countVoteByDay(@Param("cuocThiId") Long cuocThiId);

    // Danh sách vote phân trang — dùng cho admin xem chi tiết
    Page<LuotBinhChon> findByCuocThiIdOrderByCreatedAtDesc(Long cuocThiId, Pageable pageable);

    // Toàn bộ vote — dùng cho export Excel
    List<LuotBinhChon> findByCuocThiIdOrderByCreatedAtDesc(Long cuocThiId);
}

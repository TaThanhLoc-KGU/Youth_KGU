package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Enum.TrangThaiLuotThiEnum;
import com.tathanhloc.youthkgu.Model.TnLuotThi;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TnLuotThiRepository extends JpaRepository<TnLuotThi, Long> {

    /** Khoá bi quan lượt đang làm của (đề, thí sinh) — chống bấm "Bắt đầu" nhiều tab cùng lúc. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT lt FROM TnLuotThi lt WHERE lt.deThiId = :deThiId AND lt.maSv = :maSv " +
           "AND lt.trangThai = com.tathanhloc.youthkgu.Enum.TrangThaiLuotThiEnum.DANG_LAM")
    Optional<TnLuotThi> lockLuotDangLam(@Param("deThiId") Long deThiId, @Param("maSv") String maSv);

    long countByDeThiIdAndMaSv(Long deThiId, String maSv);

    List<TnLuotThi> findByMaSvOrderByThoiGianBatDauDesc(String maSv);
    Page<TnLuotThi> findByDeThiIdOrderByThoiGianBatDauDesc(Long deThiId, Pageable pageable);

    /** Lượt quá hạn nhưng chưa nộp — cho scheduler tự động nộp. */
    List<TnLuotThi> findByTrangThaiAndThoiGianHanNopBefore(TrangThaiLuotThiEnum trangThai, LocalDateTime moc);
}

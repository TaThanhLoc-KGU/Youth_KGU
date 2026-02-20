package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Model.SystemLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {

    Page<SystemLog> findByModule(String module, Pageable pageable);
    Page<SystemLog> findByUserId(String userId, Pageable pageable);
    Page<SystemLog> findByStatus(String status, Pageable pageable);

    /**
     * Tìm kiếm nhật ký thao tác với các bộ lọc tùy chọn.
     * action: CREATE | UPDATE | DELETE | LOGIN_SUCCESS | LOGIN_FAILED | ...
     */
    @Query("SELECT l FROM SystemLog l WHERE " +
            "(:module  IS NULL OR l.module  = :module)  AND " +
            "(:action  IS NULL OR l.action  = :action)  AND " +
            "(:userId  IS NULL OR l.userId  = :userId)  AND " +
            "(:startTime IS NULL OR l.createdAt >= :startTime) AND " +
            "(:endTime   IS NULL OR l.createdAt <= :endTime)   AND " +
            "(:keyword IS NULL OR " +
            "   LOWER(l.message)  LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "   LOWER(l.userName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<SystemLog> findWithFilters(
            @Param("module")    String module,
            @Param("action")    String action,
            @Param("userId")    String userId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime")   LocalDateTime endTime,
            @Param("keyword")   String keyword,
            Pageable pageable
    );

    // =================== Thống kê ===================

    @Query("SELECT l.module, COUNT(l) FROM SystemLog l GROUP BY l.module ORDER BY COUNT(l) DESC")
    List<Object[]> countByModule();

    @Query("SELECT l.action, COUNT(l) FROM SystemLog l WHERE l.action IS NOT NULL GROUP BY l.action ORDER BY COUNT(l) DESC")
    List<Object[]> countByAction();

    @Query("SELECT l.userId, l.userName, COUNT(l) FROM SystemLog l WHERE l.userId IS NOT NULL " +
           "GROUP BY l.userId, l.userName ORDER BY COUNT(l) DESC")
    List<Object[]> getTopUsers(Pageable pageable);

    @Query("SELECT COUNT(l) FROM SystemLog l WHERE l.createdAt >= :since")
    Long countSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(l) FROM SystemLog l WHERE l.logLevel IN ('ERROR', 'FATAL') AND l.createdAt >= :since")
    Long countErrorsSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(l) FROM SystemLog l WHERE l.status = 'FAILED' AND l.createdAt >= :since")
    Long countFailedSince(@Param("since") LocalDateTime since);

    // =================== Xóa log cũ ===================

    @Modifying
    @Transactional
    @Query("DELETE FROM SystemLog l WHERE l.createdAt < :cutoffDate")
    void deleteOldLogs(@Param("cutoffDate") LocalDateTime cutoffDate);
}

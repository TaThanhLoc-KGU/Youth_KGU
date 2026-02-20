package com.tathanhloc.faceattendance.Repository;

import com.tathanhloc.faceattendance.Model.SystemLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    @Query("SELECT s FROM SystemLog s WHERE " +
           "(:module IS NULL OR s.module = :module) AND " +
           "(:action IS NULL OR s.action = :action) AND " +
           "(:userId IS NULL OR s.userId = :userId) AND " +
           "(:logLevel IS NULL OR s.logLevel = :logLevel) AND " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:from IS NULL OR s.createdAt >= :from) AND " +
           "(:to IS NULL OR s.createdAt <= :to)")
    Page<SystemLog> search(@Param("module") String module,
                           @Param("action") String action,
                           @Param("userId") String userId,
                           @Param("logLevel") SystemLog.LogLevel logLevel,
                           @Param("status") String status,
                           @Param("from") LocalDateTime from,
                           @Param("to") LocalDateTime to,
                           Pageable pageable);

    List<SystemLog> findTop100ByOrderByCreatedAtDesc();
}

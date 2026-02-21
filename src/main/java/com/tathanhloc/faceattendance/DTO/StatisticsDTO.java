package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO để trả về thống kê toàn bộ hệ thống
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatisticsDTO {

    private long totalAccounts;

    private long activeAccounts;

    private long inactiveAccounts;

    private long totalActivities;

    private long totalRegistrations;

    private long totalAttendance;

    private Map<String, Long> accountsByRole;

    private Map<String, Long> accountsByDepartment;

    private Map<String, Long> accountsByApprovalStatus;
}

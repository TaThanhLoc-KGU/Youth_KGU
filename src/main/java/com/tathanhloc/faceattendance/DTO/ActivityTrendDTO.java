package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho xu hướng hoạt động theo thời gian
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityTrendDTO {
    private String period;              // Định dạng: "2024-01"
    private Integer year;               // Năm
    private Integer month;              // Tháng (1-12)
    private Long totalActivities;       // Tổng hoạt động
    private Long completedActivities;   // Hoạt động hoàn thành
    private Long totalRegistrations;    // Tổng đăng ký
    private Long totalAttendance;       // Tổng điểm danh
    private Double averageAttendanceRate;  // Tỷ lệ điểm danh trung bình
}

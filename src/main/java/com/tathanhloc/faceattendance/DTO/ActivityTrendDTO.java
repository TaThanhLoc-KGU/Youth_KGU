package com.tathanhloc.faceattendance.DTO;

import lombok.*;
import java.time.YearMonth;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityTrendDTO {
    private String period; // "2024-01"
    private Integer year;
    private Integer month;
    private Long totalActivities;
    private Long completedActivities;
    private Long totalRegistrations;
    private Long totalAttendance;
    private Double averageAttendanceRate;
}
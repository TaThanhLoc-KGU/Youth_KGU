package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSemesterData {
    private String maSv;
    private String hoTen;
    private Integer totalSessions;
    private Integer presentCount;
    private Integer lateCount;
    private Integer absentCount;
    private Double attendanceRate;
}
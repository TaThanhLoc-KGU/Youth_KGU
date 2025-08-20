package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SemesterReportData {
    private String maLhp;
    private String tenMonHoc;
    private String tenGiangVien;
    private Integer totalSessions;
    private List<StudentSemesterData> studentData;
}


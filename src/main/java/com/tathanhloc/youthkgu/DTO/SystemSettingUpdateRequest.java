package com.tathanhloc.youthkgu.DTO;

/** Body của PUT /api/system-settings/{key} — chỉ cần giá trị mới (dạng chuỗi). */
public record SystemSettingUpdateRequest(String giaTri) {}

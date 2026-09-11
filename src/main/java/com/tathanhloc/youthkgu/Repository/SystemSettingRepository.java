package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {

    /** Các dòng phục vụ qua endpoint /public (không cần đăng nhập). */
    List<SystemSetting> findByCongKhaiTrue();
}

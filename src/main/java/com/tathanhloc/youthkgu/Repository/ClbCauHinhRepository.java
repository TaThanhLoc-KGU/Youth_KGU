package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.ClbCauHinh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClbCauHinhRepository extends JpaRepository<ClbCauHinh, String> {
}

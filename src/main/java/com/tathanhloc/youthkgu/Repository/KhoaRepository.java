package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.Khoa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KhoaRepository  extends JpaRepository<Khoa, String> {
    // Custom query methods can be defined here if needed
    List<Khoa> findByIsActiveTrue();

}

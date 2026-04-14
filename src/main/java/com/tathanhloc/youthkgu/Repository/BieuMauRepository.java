package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.BieuMau;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BieuMauRepository extends JpaRepository<BieuMau, Long> {

    @Query("SELECT b FROM BieuMau b WHERE b.isActive = true ORDER BY b.thuTu ASC, b.createdAt DESC")
    List<BieuMau> findAllActive();

    @Query("SELECT b FROM BieuMau b ORDER BY b.thuTu ASC, b.createdAt DESC")
    List<BieuMau> findAllOrdered();
}

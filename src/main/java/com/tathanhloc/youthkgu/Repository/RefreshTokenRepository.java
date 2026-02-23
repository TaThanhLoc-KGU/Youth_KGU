package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.RefreshToken;
import com.tathanhloc.youthkgu.Model.TaiKhoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    @Modifying
    int deleteByTaiKhoan(TaiKhoan taiKhoan);
}

package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.UrlRedirect;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UrlRedirectRepository extends JpaRepository<UrlRedirect, Long> {

    // Tìm redirect theo URL cũ (dùng trong resolve endpoint)
    Optional<UrlRedirect> findByUrlCu(String urlCu);
}

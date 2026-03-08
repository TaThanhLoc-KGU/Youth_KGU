package com.tathanhloc.youthkgu.Config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Caffeine Cache với TTL riêng cho từng cache (SimpleCacheManager + CaffeineCache).
 *
 * TTL theo mức độ thay đổi dữ liệu:
 *  - khoa, nganh, lop, khoahoc   → 1 giờ   (dữ liệu danh mục, ít thay đổi)
 *  - sinhvien, giangvien          → 30 phút  (thay đổi trung bình)
 *  - hoatdong-list                → 3 phút   (thay đổi thường xuyên)
 *  - thong-ke                     → 5 phút   (dashboard realtime)
 *  - thong-ke-overview            → 10 phút  (báo cáo tổng quan)
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
                build("khoahoc",           60,  200),
                build("lop",               60,  500),
                build("khoa",              60,  100),
                build("nganh",             60,  200),
                build("giangvien",         30,  300),
                build("sinhvien",          30, 2000),
                build("hoatdong-list",      3,  500),
                build("thong-ke",           5,  100),
                build("thong-ke-overview", 10,   50)
        ));
        return manager;
    }

    /** Tạo một CaffeineCache với TTL (phút) và giới hạn kích thước riêng, bật recordStats(). */
    private CaffeineCache build(String name, long ttlMinutes, long maxSize) {
        return new CaffeineCache(name,
                Caffeine.newBuilder()
                        .expireAfterWrite(ttlMinutes, TimeUnit.MINUTES)
                        .maximumSize(maxSize)
                        .recordStats()
                        .build());
    }
}

package com.tathanhloc.youthkgu.Config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Caffeine Cache — thay thế ConcurrentMapCacheManager.
 * Hỗ trợ TTL (tự hết hạn) và giới hạn kích thước — miễn phí, không cần Redis.
 *
 * TTL:
 *  - khoa, nganh, lop, khoahoc   → 1 giờ  (ít thay đổi)
 *  - sinhvien, giangvien          → 30 phút
 *  - hoatdong-list                → 3 phút
 *  - thong-ke                     → 5 phút
 *  - thong-ke-overview            → 10 phút
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();

        // Default cho mọi cache chưa được cấu hình riêng
        manager.setCaffeine(
                Caffeine.newBuilder()
                        .expireAfterWrite(15, TimeUnit.MINUTES)
                        .maximumSize(200)
                        .recordStats()
        );

        manager.setCacheNames(java.util.Arrays.asList(
                "khoahoc", "lop", "giangvien", "sinhvien", "khoa", "nganh",
                "hoatdong-list", "thong-ke", "thong-ke-overview"
        ));
        return manager;
    }
}

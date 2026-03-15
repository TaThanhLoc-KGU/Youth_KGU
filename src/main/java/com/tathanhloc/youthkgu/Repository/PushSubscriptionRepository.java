package com.tathanhloc.youthkgu.Repository;

import com.tathanhloc.youthkgu.Model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    List<PushSubscription> findByUserIdAndIsActiveTrue(String userId);

    Optional<PushSubscription> findByEndpoint(String endpoint);

    /** Tất cả subscription đang active (để gửi broadcast) */
    List<PushSubscription> findAllByIsActiveTrue();

    /** Đếm số thiết bị đang active — cho admin xem trước khi gửi */
    long countByIsActiveTrue();

    /** Đếm số user duy nhất đã bật thông báo */
    @Query("SELECT COUNT(DISTINCT p.userId) FROM PushSubscription p WHERE p.isActive = true")
    long countDistinctActiveUsers();

    boolean existsByUserIdAndIsActiveTrue(String userId);
}

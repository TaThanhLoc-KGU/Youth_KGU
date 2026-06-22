package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.Model.ClbCauHinh;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;

@Service
@Slf4j
public class PayOSConfigService {

    public PayOS getPayOSInstance(ClbCauHinh cauHinh) {
        if (cauHinh == null) {
            log.warn("ClbCauHinh is null, cannot create PayOS instance.");
            return null;
        }
        
        String clientId = cauHinh.getPayosClientId();
        String apiKey = cauHinh.getPayosApiKey();
        String checksumKey = cauHinh.getPayosChecksumKey();

        if (clientId == null || clientId.isBlank() ||
            apiKey == null || apiKey.isBlank() ||
            checksumKey == null || checksumKey.isBlank()) {
            return null; // PayOS is not configured for this club
        }

        try {
            return new PayOS(clientId, apiKey, checksumKey);
        } catch (Exception e) {
            log.error("Error creating PayOS instance for club: {}", cauHinh.getMaClb(), e);
            return null;
        }
    }
}

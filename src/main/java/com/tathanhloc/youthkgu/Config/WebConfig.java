package com.tathanhloc.youthkgu.Config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebConfig.class);

    /** Đọc cùng property với FileStorageService và QRCodeService */
    @Value("${app.upload.path:./uploads}")
    private String uploadBasePath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        log.info("🔧 Configuring static resource handlers");

        // ✅ CRITICAL FIX: Đảm bảo streams được serve từ file system

        // Method 1: Serve from target directory (for Maven builds)
        File targetStreamsDir = new File("target/classes/static/streams");
        if (targetStreamsDir.exists()) {
            String targetPath = targetStreamsDir.getAbsolutePath().replace("\\", "/");
            registry.addResourceHandler("/streams/**")
                    .addResourceLocations("file:///" + targetPath + "/")
                    .setCachePeriod(0)  // No cache for live streams
                    .resourceChain(false);
            log.info("✅ Added TARGET streams handler: file:///{}", targetPath);
        }

        // Method 2: Serve from src directory (for development)
        File srcStreamsDir = new File("src/main/resources/static/streams");
        if (srcStreamsDir.exists()) {
            String srcPath = srcStreamsDir.getAbsolutePath().replace("\\", "/");
            registry.addResourceHandler("/streams/**")
                    .addResourceLocations("file:///" + srcPath + "/")
                    .setCachePeriod(0)
                    .resourceChain(false);
            log.info("✅ Added SRC streams handler: file:///{}", srcPath);
        }

        // Method 3: Classpath fallback
        registry.addResourceHandler("/streams/**")
                .addResourceLocations("classpath:/static/streams/")
                .setCachePeriod(0)
                .resourceChain(false);
        log.info("✅ Added CLASSPATH streams handler");

        // ✅ UPLOADS — dùng app.upload.path để đồng nhất với FileStorageService & QRCodeService
        // Chuyển relative path thành absolute để Spring Resource handler hoạt động đúng
        String uploadsPath = Paths.get(uploadBasePath).toAbsolutePath().normalize()
                .toString().replace("\\", "/");
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:///" + uploadsPath + "/")
                .setCachePeriod(86400)
                .resourceChain(true);
        log.info("✅ Serving uploads from: file:///{}", uploadsPath);

        // ✅ STATIC resources configuration
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(3600);

        // ✅ CSS, JS, Images
        registry.addResourceHandler("/css/**")
                .addResourceLocations("classpath:/static/css/");

        registry.addResourceHandler("/js/**")
                .addResourceLocations("classpath:/static/js/");

        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/");

        log.info("✅ All resource handlers configured successfully");
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Override
    public void addCorsMappings(org.springframework.web.servlet.config.annotation.CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:4200", "http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
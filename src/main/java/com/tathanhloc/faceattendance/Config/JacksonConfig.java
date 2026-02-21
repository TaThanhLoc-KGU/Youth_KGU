package com.tathanhloc.faceattendance.Config;

import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for Jackson to handle Hibernate lazy-loading proxies.
 */
@Configuration
public class JacksonConfig {

    /**
     * Creates a Hibernate6Module bean that will be automatically registered with
     * the default ObjectMapper. This module teaches Jackson how to handle
     * Hibernate-specific types and lazy-loading proxies, preventing serialization errors.
     *
     * @return The Hibernate6Module.
     */
    @Bean
    public Module hibernate6Module() {
        return new Hibernate6Module();
    }
}

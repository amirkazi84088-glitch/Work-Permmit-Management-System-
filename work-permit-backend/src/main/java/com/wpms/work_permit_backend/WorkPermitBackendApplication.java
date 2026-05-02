package com.wpms.work_permit_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.wpms")
@EntityScan(basePackages = "com.wpms.entity")
@EnableJpaRepositories(basePackages = "com.wpms.repository")
@EnableScheduling
public class WorkPermitBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkPermitBackendApplication.class, args);
    }
}

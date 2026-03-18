package com.ghaith.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GhaithErpApplication {

    public static void main(String[] args) {
        SpringApplication.run(GhaithErpApplication.class, args);
    }

}

package com.diwana;

import com.diwana.config.OpenAiProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableConfigurationProperties(OpenAiProperties.class)
@EnableAsync
@EnableScheduling
public class DiwanaApplication {

    public static void main(String[] args) {
        SpringApplication.run(DiwanaApplication.class, args);
    }
}

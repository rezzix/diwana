package com.diwana;

import com.diwana.config.OpenAiProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(OpenAiProperties.class)
public class DiwanaApplication {

    public static void main(String[] args) {
        SpringApplication.run(DiwanaApplication.class, args);
    }
}

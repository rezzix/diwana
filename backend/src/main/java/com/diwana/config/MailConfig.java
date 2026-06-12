package com.diwana.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

import java.util.Properties;

/**
 * Overrides the mail sender password with the real key from ai-keys.csv
 * and reinitializes the session so authentication works.
 * Runs after AiKeyLoader (@Order(100)) so keys are available.
 */
@Component
@Order(200)
public class MailConfig implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

    private final AiKeyLoader aiKeyLoader;
    private final JavaMailSenderImpl mailSender;

    public MailConfig(AiKeyLoader aiKeyLoader, JavaMailSenderImpl mailSender) {
        this.aiKeyLoader = aiKeyLoader;
        this.mailSender = mailSender;
    }

    @Override
    public void run(String... args) {
        String smtpKey = aiKeyLoader.getKey("brevo", "smtp", null);
        if (smtpKey != null) {
            mailSender.setPassword(smtpKey);
            // Force session recreation with the new password
            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            mailSender.setSession(null);
            log.info("[Mail] SMTP password loaded from ai-keys.csv");
        } else {
            log.warn("[Mail] No Brevo SMTP key found in ai-keys.csv — email notifications will not work");
        }
    }
}
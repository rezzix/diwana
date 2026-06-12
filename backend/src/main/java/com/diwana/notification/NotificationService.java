package com.diwana.notification;

import com.diwana.declaration.Declaration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final JavaMailSender mailSender;

    public NotificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send an email asynchronously.
     */
    @Async
    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom("diwana@mederp.net");
            mailSender.send(message);
            log.info("[Mail] Email sent to {} with subject: {}", to, subject);
        } catch (Exception e) {
            log.error("[Mail] Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    /**
     * Notify the declarant that additional information has been requested.
     */
    public void sendInfoRequestNotification(Declaration declaration, String note) {
        String declarantEmail = declaration.getDeclarant().getEmail();
        String declarantName = declaration.getDeclarant().getFirstName() + " " + declaration.getDeclarant().getLastName();
        String declarationNumber = declaration.getDeclarationNumber();

        String subject = "Diwana — Additional information requested for declaration " + declarationNumber;
        String body = """
                Dear %s,

                The customs controller has requested additional information for your declaration %s.

                Request note: %s

                Please log in to Diwana to provide the requested information.

                — Diwana Customs Declaration System""".formatted(declarantName, declarationNumber, note);

        sendEmail(declarantEmail, subject, body);
    }
}
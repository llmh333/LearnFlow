package com.learnflow.backend.auth;

import java.time.Duration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Emails the reset code after the transaction commits, on a background thread, so SMTP latency
 * neither holds a DB connection nor makes known emails answer slower than unknown ones. Without
 * {@code spring.mail.host} (local dev) there is no mail sender and the code is logged instead; prod
 * requires SMTP_HOST, so this fallback never runs there.
 */
@Component
public class PasswordResetMailer {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetMailer.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String from;
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    public PasswordResetMailer(
            ObjectProvider<JavaMailSender> mailSender,
            @Value("${app.mail.from:LearnFlow <no-reply@learnflow.local>}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public void sendAfterCommit(String to, String displayName, String code, Duration ttl) {
        Runnable send = () -> executor.execute(() -> send(to, displayName, code, ttl));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            send.run();
                        }
                    });
        } else {
            send.run();
        }
    }

    private void send(String to, String displayName, String code, Duration ttl) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.warn(
                    "No SMTP configured (spring.mail.host); password reset code for {}: {}",
                    to,
                    code);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("LearnFlow - Mã đặt lại mật khẩu");
        message.setText(
                "Xin chào "
                        + displayName
                        + ",\n\nMã đặt lại mật khẩu LearnFlow của bạn là: "
                        + code
                        + "\n\nMã có hiệu lực trong "
                        + ttl.toMinutes()
                        + " phút. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.");
        try {
            sender.send(message);
        } catch (RuntimeException e) {
            log.error("Failed to send password reset email to {}", to, e);
        }
    }
}

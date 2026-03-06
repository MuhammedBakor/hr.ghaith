package com.ghaith.erp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:}")
    private String fromEmail;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public void sendCredentials(String to, String firstName, String temporaryPassword) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("مرحباً بك في نظام غيث - بيانات الدخول الخاصة بك");

            String content = String.format(
                    "مرحباً %s،\n\n" +
                            "تم إنشاء حساب لك في نظام غيث (Ghaith ERP).\n" +
                            "إليك بيانات الدخول الخاصة بك:\n\n" +
                            "البريد الإلكتروني: %s\n" +
                            "كلمة المرور المؤقتة: %s\n\n" +
                            "يرجى تسجيل الدخول وتغيير كلمة المرور الخاصة بك في أقرب وقت.\n" +
                            "رابط النظام: " + frontendUrl + "/login\n\n" +
                            "مع تحيات إدارة النظام.",
                    firstName, to, temporaryPassword);

            message.setText(content);
            System.out.println("Attempting to send email via mailSender... From: " + fromEmail + " To: " + to);
            mailSender.send(message);
            System.out.println("mailSender.send() returned successfully.");
            log.info("Credentials email sent successfully to {}", to);
        } catch (Exception e) {
            System.out.println("EXCEPTION in EmailService.sendCredentials: " + e.getMessage());
            e.printStackTrace();
            log.error("Failed to send credentials email to {}: {}", to, e.getMessage());
            // We don't throw an exception here because we don't want to roll back
            // the employee creation if only the email fails.
            // In a production app, you might want to retry or log this for manual action.
        }
    }

    public void sendVerificationCode(String to, String firstName, String code, String employeeNumber) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("كود تفعيل حسابك في منصة غيث");

            String activationUrl = String.format("%s/activate?emp=%s&code=%s", frontendUrl, employeeNumber, code);

            String content = String.format(
                    "مرحباً %s،\n\n" +
                            "شكراً لانضمامك إلى منصة غيث. لإكمال تفعيل حسابك، اضغط على الرابط التالي:\n\n" +
                            "رابط التفعيل: %s\n\n" +
                            "أو استخدم البيانات التالية في صفحة التفعيل:\n" +
                            "الرقم الوظيفي: %s\n" +
                            "كود التفعيل: %s\n\n" +
                            "بعد التفعيل وإنشاء كلمة المرور، يمكنك تسجيل الدخول باستخدام:\n" +
                            "البريد الإلكتروني: %s\n" +
                            "كلمة المرور: التي ستقوم بإنشائها أثناء التفعيل\n\n" +
                            "مع تحيات،\nفريق منصة غيث",
                    firstName, activationUrl, employeeNumber, code, to);

            message.setText(content);
            System.out.println("Attempting to send verification email... From: " + fromEmail + " To: " + to);
            mailSender.send(message);
            System.out.println("Verification email sent successfully.");
            log.info("Verification code sent successfully to {}", to);
        } catch (Exception e) {
            System.out.println("EXCEPTION in EmailService.sendVerificationCode: " + e.getMessage());
            e.printStackTrace();
            log.error("Failed to send verification code to {}: {}", to, e.getMessage());
        }
    }

    public void sendPasswordResetCode(String to, String firstName, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("إعادة تعيين كلمة المرور - منصة غيث");

            String content = String.format(
                    "مرحباً %s،\n\n" +
                            "لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.\n\n" +
                            "رمز التحقق: %s\n\n" +
                            "أدخل هذا الرمز في صفحة إعادة تعيين كلمة المرور لإكمال العملية.\n" +
                            "إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.\n\n" +
                            "مع تحيات،\nفريق منصة غيث",
                    firstName, code);

            message.setText(content);
            mailSender.send(message);
            log.info("Password reset code sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send password reset code to {}: {}", to, e.getMessage());
            throw new RuntimeException("فشل إرسال رمز التحقق إلى البريد الإلكتروني");
        }
    }
}

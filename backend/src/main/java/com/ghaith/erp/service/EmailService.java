package com.ghaith.erp.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("مرحباً بك في نظام غيث - بيانات الدخول الخاصة بك");

            String htmlContent = String.format(
                    "<div dir='rtl' style='text-align: right; font-family: sans-serif;'>" +
                            "مرحباً %s،<br><br>" +
                            "تم إنشاء حساب لك في نظام غيث (Ghaith ERP).<br>" +
                            "إليك بيانات الدخول الخاصة بك:<br><br>" +
                            "البريد الإلكتروني: <b>%s</b><br>" +
                            "كلمة المرور المؤقتة: <b>%s</b><br><br>" +
                            "يرجى تسجيل الدخول وتغيير كلمة المرور الخاصة بك في أقرب وقت.<br>" +
                            "رابط النظام: <a href='%s/login'>%s/login</a><br><br>" +
                            "مع تحيات إدارة النظام." +
                            "</div>",
                    firstName, to, temporaryPassword, frontendUrl, frontendUrl);

            helper.setText(htmlContent, true);
            log.info("Attempting to send credentials email to {}", to);
            mailSender.send(message);
            log.info("Credentials email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send credentials email to {}: {}", to, e.getMessage());
        }
    }

    public void sendVerificationCode(String to, String firstName, String code, String employeeNumber) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("كود تفعيل حسابك في منصة غيث");

            String activationUrl = String.format("%s/activate?emp=%s&code=%s", frontendUrl, employeeNumber, code);

            String htmlContent = String.format(
                    "<div dir='rtl' style='text-align: right; font-family: sans-serif;'>" +
                            "مرحباً %s،<br><br>" +
                            "شكراً لانضمامك إلى منصة غيث. لإكمال تفعيل حسابك، اضغط على الرابط التالي:<br><br>" +
                            "<b><a href='%s'>رابط التفعيل</a></b><br><br>" +
                            "أو استخدم البيانات التالية في صفحة التفعيل:<br>" +
                            "الرقم الوظيفي: <b>%s</b><br>" +
                            "كود التفعيل: <b>%s</b><br><br>" +
                            "بعد التفعيل وإنشاء كلمة المرور، يمكنك تسجيل الدخول باستخدام:<br>" +
                            "البريد الإلكتروني: <b>%s</b><br>" +
                            "كلمة المرور: التي ستقوم بإنشائها أثناء التفعيل<br><br>" +
                            "مع تحيات،<br>فريق منصة غيث" +
                            "</div>",
                    firstName, activationUrl, employeeNumber, code, to);

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Verification code sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send verification code to {}: {}", to, e.getMessage());
        }
    }

    public void sendInterviewScheduled(String to, String applicantName, String position,
            String interviewType, String scheduledAt,
            Integer duration, String location, String meetingLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("دعوة لمقابلة عمل - " + position);

            String typeLabel = switch (interviewType != null ? interviewType : "") {
                case "phone" -> "هاتفية";
                case "video" -> "فيديو";
                case "in_person" -> "حضورية";
                case "technical" -> "تقنية";
                case "hr" -> "موارد بشرية";
                case "final" -> "نهائية";
                default -> interviewType != null ? interviewType : "غير محدد";
            };

            StringBuilder htmlContent = new StringBuilder();
            htmlContent.append("<div dir='rtl' style='text-align: right; font-family: sans-serif;'>");
            htmlContent.append(String.format("مرحباً %s،<br><br>", applicantName));
            htmlContent.append(
                    String.format("يسعدنا إبلاغك بأنه تم جدولة مقابلة عمل لوظيفة: <b>%s</b><br><br>", position));
            htmlContent.append("<b>تفاصيل المقابلة:</b><br>");
            htmlContent.append(String.format("- نوع المقابلة: %s<br>", typeLabel));
            htmlContent.append(String.format("- الموعد: %s<br>", scheduledAt));
            if (duration != null)
                htmlContent.append(String.format("- المدة: %d دقيقة<br>", duration));
            if (location != null && !location.isBlank())
                htmlContent.append(String.format("- المكان: %s<br>", location));
            if (meetingLink != null && !meetingLink.isBlank())
                htmlContent.append(String.format("- رابط الاجتماع: <a href='%s'>%s</a><br>", meetingLink, meetingLink));
            htmlContent.append("<br>نتمنى لك التوفيق.<br><br>مع تحيات،<br>فريق التوظيف - منصة غيث");
            htmlContent.append("</div>");

            helper.setText(htmlContent.toString(), true);
            mailSender.send(message);
            log.info("Interview scheduled email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send interview scheduled email to {}: {}", to, e.getMessage());
        }
    }

    public void sendInterviewUpdated(String to, String applicantName, String position,
            String interviewType, String scheduledAt,
            Integer duration, String location, String meetingLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("تحديث موعد المقابلة - " + position);

            String typeLabel = switch (interviewType != null ? interviewType : "") {
                case "phone" -> "هاتفية";
                case "video" -> "فيديو";
                case "in_person" -> "حضورية";
                case "technical" -> "تقنية";
                case "hr" -> "موارد بشرية";
                case "final" -> "نهائية";
                default -> interviewType != null ? interviewType : "غير محدد";
            };

            StringBuilder htmlContent = new StringBuilder();
            htmlContent.append("<div dir='rtl' style='text-align: right; font-family: sans-serif;'>");
            htmlContent.append(String.format("مرحباً %s،<br><br>", applicantName));
            htmlContent
                    .append(String.format("نود إبلاغك بأنه تم تعديل موعد مقابلتك لوظيفة: <b>%s</b><br><br>", position));
            htmlContent.append("<b>التفاصيل المحدّثة للمقابلة:</b><br>");
            htmlContent.append(String.format("- نوع المقابلة: %s<br>", typeLabel));
            htmlContent.append(String.format("- الموعد الجديد: %s<br>", scheduledAt));
            if (duration != null)
                htmlContent.append(String.format("- المدة: %d دقيقة<br>", duration));
            if (location != null && !location.isBlank())
                htmlContent.append(String.format("- المكان: %s<br>", location));
            if (meetingLink != null && !meetingLink.isBlank())
                htmlContent.append(String.format("- رابط الاجتماع: <a href='%s'>%s</a><br>", meetingLink, meetingLink));
            htmlContent.append("<br>نتمنى لك التوفيق.<br><br>مع تحيات،<br>فريق التوظيف - منصة غيث");
            htmlContent.append("</div>");

            helper.setText(htmlContent.toString(), true);
            mailSender.send(message);
            log.info("Interview updated email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send interview updated email to {}: {}", to, e.getMessage());
        }
    }

    public void sendInterviewCancelled(String to, String applicantName, String position) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("إلغاء موعد المقابلة - " + position);

            String htmlContent = String.format(
                    "<div dir='rtl' style='text-align: right; font-family: sans-serif;'>" +
                    "مرحباً %s،<br><br>" +
                    "نود إبلاغك بأنه تم <b>إلغاء</b> موعد مقابلتك لوظيفة: <b>%s</b><br><br>" +
                    "نعتذر عن أي إزعاج، وسنتواصل معك قريباً لتحديد موعد بديل إن أمكن.<br><br>" +
                    "مع تحيات،<br>فريق التوظيف - منصة غيث" +
                    "</div>",
                    applicantName, position);

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Interview cancelled email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send interview cancelled email to {}: {}", to, e.getMessage());
        }
    }

    public void sendPasswordResetCode(String to, String firstName, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("إعادة تعيين كلمة المرور - منصة غيث");

            String htmlContent = String.format(
                    "<div dir='rtl' style='text-align: right; font-family: sans-serif;'>" +
                            "مرحباً %s،<br><br>" +
                            "لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.<br><br>" +
                            "رمز التحقق: <b>%s</b><br><br>" +
                            "أدخل هذا الرمز في صفحة إعادة تعيين كلمة المرور لإكمال العملية.<br>" +
                            "إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.<br><br>" +
                            "مع تحيات،<br>فريق منصة غيث" +
                            "</div>",
                    firstName, code);

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Password reset code sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send password reset code to {}: {}", to, e.getMessage());
            throw new RuntimeException("فشل إرسال رمز التحقق إلى البريد الإلكتروني");
        }
    }
}

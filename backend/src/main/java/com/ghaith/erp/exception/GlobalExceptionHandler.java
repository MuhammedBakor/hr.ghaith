package com.ghaith.erp.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getReason());
        error.put("message", ex.getReason());
        return ResponseEntity.status(ex.getStatusCode()).body(error);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "خطأ في اسم المستخدم أو كلمة المرور");
        error.put("message", "خطأ في اسم المستخدم أو كلمة المرور");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, String>> handleDisabled(DisabledException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "الحساب غير مفعل، يرجى تفعيل الحساب أولاً");
        error.put("message", "الحساب غير مفعل، يرجى تفعيل الحساب أولاً");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUsernameNotFound(UsernameNotFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "المستخدم غير موجود");
        error.put("message", "المستخدم غير موجود");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(Exception ex) {
        ex.printStackTrace();
        Map<String, String> error = new HashMap<>();
        error.put("error", "حدث خطأ غير متوقع: " + ex.getMessage());
        error.put("message", "حدث خطأ غير متوقع: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}

package com.ghaith.erp.service;

import com.ghaith.erp.dto.SessionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class SessionService {

    // Simple in-memory session store for now, should ideally use Redis or DB
    private final ConcurrentHashMap<String, SessionResponse> sessions = new ConcurrentHashMap<>();

    public List<SessionResponse> getAllSessions() {
        return new ArrayList<>(sessions.values());
    }

    public void terminateSession(String sessionId) {
        SessionResponse session = sessions.get(sessionId);
        if (session != null) {
            session.setRevoked(true);
        }
    }

    // This would be called by the Auth filter on every request
    public void recordActivity(String sessionId, Long userId, String userName, String ip, String ua) {
        sessions.compute(sessionId, (id, existing) -> {
            if (existing == null) {
                return SessionResponse.builder()
                        .id(id)
                        .userId(userId)
                        .userName(userName)
                        .ipAddress(ip)
                        .userAgent(ua)
                        .createdAt(LocalDateTime.now())
                        .lastActivityAt(LocalDateTime.now())
                        .isRevoked(false)
                        .build();
            }
            existing.setLastActivityAt(LocalDateTime.now());
            return existing;
        });
    }
}

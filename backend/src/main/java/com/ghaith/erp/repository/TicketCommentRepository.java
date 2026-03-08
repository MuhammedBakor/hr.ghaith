package com.ghaith.erp.repository;

import com.ghaith.erp.model.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {
    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
    void deleteByTicketId(Long ticketId);
}

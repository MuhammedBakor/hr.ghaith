package com.ghaith.erp.repository;

import com.ghaith.erp.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByAuthorId(Long authorId);

    List<Ticket> findByStatus(String status);

    List<Ticket> findAllByOrderByCreatedAtDesc();
}

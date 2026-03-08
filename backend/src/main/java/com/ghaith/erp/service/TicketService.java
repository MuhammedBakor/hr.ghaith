package com.ghaith.erp.service;

import com.ghaith.erp.model.Ticket;
import com.ghaith.erp.model.TicketComment;
import com.ghaith.erp.repository.TicketCommentRepository;
import com.ghaith.erp.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository ticketCommentRepository;

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc();
    }

    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("التذكرة غير موجودة"));
    }

    @Transactional
    public Ticket createTicket(Ticket ticket) {
        if (ticket.getTicketNumber() == null) {
            ticket.setTicketNumber("TKT-" + System.currentTimeMillis());
        }
        if (ticket.getStatus() == null) {
            ticket.setStatus("open");
        }
        return ticketRepository.save(ticket);
    }

    @Transactional
    public Ticket updateTicket(Long id, Ticket ticketDetails) {
        Ticket ticket = getTicketById(id);
        if (ticketDetails.getSubject() != null)
            ticket.setSubject(ticketDetails.getSubject());
        if (ticketDetails.getDescription() != null)
            ticket.setDescription(ticketDetails.getDescription());
        if (ticketDetails.getPriority() != null)
            ticket.setPriority(ticketDetails.getPriority());
        if (ticketDetails.getCategory() != null)
            ticket.setCategory(ticketDetails.getCategory());
        if (ticketDetails.getStatus() != null)
            ticket.setStatus(ticketDetails.getStatus());
        return ticketRepository.save(ticket);
    }

    public List<TicketComment> getComments(Long ticketId) {
        return ticketCommentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    @Transactional
    public TicketComment addComment(Long ticketId, TicketComment comment) {
        comment.setTicketId(ticketId);
        return ticketCommentRepository.save(comment);
    }

    @Transactional
    public void deleteTicket(Long id) {
        ticketCommentRepository.deleteByTicketId(id);
        ticketRepository.deleteById(id);
    }
}

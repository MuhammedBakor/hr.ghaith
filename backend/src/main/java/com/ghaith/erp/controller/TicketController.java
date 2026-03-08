package com.ghaith.erp.controller;

import com.ghaith.erp.model.Ticket;
import com.ghaith.erp.model.TicketComment;
import com.ghaith.erp.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/support/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody Ticket ticket) {
        return ResponseEntity.ok(ticketService.createTicket(ticket));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ticket> updateTicket(@PathVariable Long id, @RequestBody Ticket ticket) {
        return ResponseEntity.ok(ticketService.updateTicket(id, ticket));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<TicketComment>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getComments(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTicket(@PathVariable Long id) {
        ticketService.deleteTicket(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketComment> addComment(@PathVariable Long id, @RequestBody TicketComment comment) {
        return ResponseEntity.ok(ticketService.addComment(id, comment));
    }
}

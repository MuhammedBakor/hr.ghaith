package com.ghaith.erp.service;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    public List<Ticket> getAllTickets() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        User currentUser = userRepository.findByEmail(userEmail).orElse(null);

        if (currentUser == null)
            return List.of();

        Role role = currentUser.getRole();
        Employee currentEmployee = employeeRepository.findAllByUserId(currentUser.getId())
                .stream().findFirst().orElse(null);

        List<Ticket> allTickets = ticketRepository.findAllByOrderByCreatedAtDesc();

        if (role == Role.OWNER || role == Role.GENERAL_MANAGER) {
            // Populate author metadata for all tickets
            allTickets.forEach(this::populateAuthorMetadata);
            return allTickets;
        }

        if (role == Role.DEPARTEMENT_MANAGER && currentEmployee != null && currentEmployee.getDepartment() != null) {
            Long myDeptId = currentEmployee.getDepartment().getId();
            List<Ticket> filtered = allTickets.stream()
                    .filter(t -> {
                        if (t.getAuthorId() == null)
                            return false;
                        if (t.getAuthorId().equals(currentUser.getId()))
                            return true;

                        // Check if author is in the same department
                        Employee authorEmp = employeeRepository.findAllByUserId(t.getAuthorId())
                                .stream().findFirst().orElse(null);
                        return authorEmp != null && authorEmp.getDepartment() != null &&
                                authorEmp.getDepartment().getId().equals(myDeptId);
                    })
                    .collect(Collectors.toList());
            filtered.forEach(this::populateAuthorMetadata);
            return filtered;
        }

        // Default: only see own tickets
        List<Ticket> ownTickets = allTickets.stream()
                .filter(t -> t.getAuthorId() != null && t.getAuthorId().equals(currentUser.getId()))
                .collect(Collectors.toList());
        ownTickets.forEach(this::populateAuthorMetadata);
        return ownTickets;
    }

    private void populateAuthorMetadata(Ticket ticket) {
        if (ticket.getAuthorId() == null)
            return;

        userRepository.findById(ticket.getAuthorId()).ifPresent(user -> {
            ticket.setAuthorRole(user.getRole().toString());
            ticket.setAuthorName(user.getUsername()); // Fallback

            employeeRepository.findAllByUserId(user.getId()).stream().findFirst().ifPresent(emp -> {
                if (emp.getFirstName() != null) {
                    ticket.setAuthorName(emp.getFirstName() + " " + emp.getLastName());
                }
                if (emp.getDepartment() != null) {
                    ticket.setAuthorDepartment(emp.getDepartment().getNameAr());
                }
                if (emp.getBranch() != null) {
                    ticket.setAuthorBranch(emp.getBranch().getNameAr());
                }
            });
        });
    }

    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("التذكرة غير موجودة"));
    }

    @Transactional
    public Ticket createTicket(Ticket ticket) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        User currentUser = userRepository.findByEmail(userEmail).orElse(null);
        if (currentUser != null) {
            ticket.setAuthorId(currentUser.getId());
        }

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
        Ticket ticket = getTicketById(id);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        User currentUser = userRepository.findByEmail(userEmail).orElse(null);

        if (currentUser == null) {
            throw new RuntimeException("غير مصرح لك بحذف هذه التذكرة");
        }

        Role role = currentUser.getRole();
        boolean isOwnerOrGM = role == Role.OWNER || role == Role.GENERAL_MANAGER;

        if (!isOwnerOrGM && (ticket.getAuthorId() == null || !ticket.getAuthorId().equals(currentUser.getId()))) {
            throw new RuntimeException("لا تملك صلاحية حذف هذه التذكرة");
        }

        ticketCommentRepository.deleteByTicketId(id);
        ticketRepository.deleteById(id);
    }
}

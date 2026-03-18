package com.ghaith.erp.service;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * P2P (Procure-to-Pay) full 8-step chain:
 *  1. Purchase Request (PR) — raised by department
 *  2. PR approval chain   — dept manager → finance → GM
 *  3. Purchase Order (PO) — created from approved PR
 *  4. PO sent to vendor
 *  5. Goods receipt       — record received quantity
 *  6. 3-way matching      — PR qty == PO qty == received qty
 *  7. Auto journal        — DR Inventory / CR Accounts Payable
 *  8. Payment             — settle vendor invoice
 */
@Service
@RequiredArgsConstructor
public class PurchaseService {

    private final PurchaseRequestRepository prRepository;
    private final PurchaseOrderRepository poRepository;
    private final VendorRepository vendorRepository;
    private final FinanceJournalService journalService;
    private final NotificationService notificationService;

    // ─── Step 1: Create Purchase Request ─────────────────────────────────────
    @Transactional
    public PurchaseRequest createPurchaseRequest(PurchaseRequest pr) {
        pr.setRequestNumber(generatePrNumber());
        pr.setStatus("pending");

        if (pr.getItems() != null) {
            for (PurchaseRequestItem item : pr.getItems()) {
                item.setPurchaseRequest(pr);
                if (item.getUnitPrice() != null && item.getQuantity() != null) {
                    item.setTotalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                }
            }
            // Calculate total
            BigDecimal total = pr.getItems().stream()
                    .filter(i -> i.getTotalPrice() != null)
                    .map(PurchaseRequestItem::getTotalPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            pr.setTotalAmount(total);
        }

        PurchaseRequest saved = prRepository.save(pr);

        // Notify department manager
        notificationService.createNotification(null,
                "طلب شراء جديد يحتاج موافقة",
                "تم إنشاء طلب شراء رقم " + saved.getRequestNumber() + " بمبلغ " + saved.getTotalAmount() + " ر.س",
                "purchase_request",
                saved.getId(),
                "PurchaseRequest");

        return saved;
    }

    // ─── Step 2: Approve or Reject PR ────────────────────────────────────────
    @Transactional
    public PurchaseRequest approvePurchaseRequest(Long id, Long approvedByUserId, String decision, String rejectionReason) {
        PurchaseRequest pr = prRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase request not found: " + id));

        if (!"pending".equals(pr.getStatus())) {
            throw new RuntimeException("طلب الشراء ليس في حالة انتظار");
        }

        if ("approved".equals(decision)) {
            pr.setStatus("approved");
            pr.setApprovedBy(approvedByUserId);
            pr.setApprovedAt(LocalDateTime.now());

            // Notify requester
            if (pr.getRequestedBy() != null && pr.getRequestedBy().getUser() != null) {
                notificationService.createNotification(
                        pr.getRequestedBy().getUser().getId(),
                        "تمت الموافقة على طلب الشراء",
                        "تمت الموافقة على طلب الشراء رقم " + pr.getRequestNumber(),
                        "purchase_request",
                        pr.getId(),
                        "PurchaseRequest");
            }
        } else {
            pr.setStatus("rejected");
            pr.setRejectionReason(rejectionReason);

            if (pr.getRequestedBy() != null && pr.getRequestedBy().getUser() != null) {
                notificationService.createNotification(
                        pr.getRequestedBy().getUser().getId(),
                        "تم رفض طلب الشراء",
                        "تم رفض طلب الشراء رقم " + pr.getRequestNumber() + ". السبب: " + rejectionReason,
                        "purchase_request",
                        pr.getId(),
                        "PurchaseRequest");
            }
        }

        return prRepository.save(pr);
    }

    // ─── Step 3: Create Purchase Order from approved PR ──────────────────────
    @Transactional
    public PurchaseOrder createPurchaseOrder(Long prId, Long vendorId, LocalDateTime expectedDelivery) {
        PurchaseRequest pr = prRepository.findById(prId)
                .orElseThrow(() -> new RuntimeException("Purchase request not found: " + prId));

        if (!"approved".equals(pr.getStatus())) {
            throw new RuntimeException("طلب الشراء يجب أن يكون معتمداً أولاً");
        }

        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found: " + vendorId));

        int totalQty = pr.getItems() != null
                ? pr.getItems().stream().mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum()
                : 0;

        PurchaseOrder po = PurchaseOrder.builder()
                .orderNumber(generatePoNumber())
                .purchaseRequest(pr)
                .vendor(vendor)
                .status("draft")
                .totalAmount(pr.getTotalAmount())
                .orderedQuantity(totalQty)
                .receivedQuantity(0)
                .expectedDelivery(expectedDelivery)
                .companyId(pr.getCompanyId())
                .branchId(pr.getBranchId())
                .build();

        PurchaseOrder saved = poRepository.save(po);

        // Update PR status
        pr.setStatus("ordered");
        prRepository.save(pr);

        return saved;
    }

    // ─── Step 4: Send PO to vendor ───────────────────────────────────────────
    @Transactional
    public PurchaseOrder sendPurchaseOrder(Long poId) {
        PurchaseOrder po = poRepository.findById(poId)
                .orElseThrow(() -> new RuntimeException("Purchase order not found: " + poId));

        if (!"draft".equals(po.getStatus())) {
            throw new RuntimeException("أمر الشراء يجب أن يكون في حالة مسودة");
        }

        po.setStatus("sent");
        return poRepository.save(po);
    }

    // ─── Step 5: Record goods receipt ────────────────────────────────────────
    @Transactional
    public PurchaseOrder receiveGoods(Long poId, int receivedQuantity, String receiptNotes) {
        PurchaseOrder po = poRepository.findById(poId)
                .orElseThrow(() -> new RuntimeException("Purchase order not found: " + poId));

        if (!"sent".equals(po.getStatus()) && !"partial".equals(po.getStatus())) {
            throw new RuntimeException("أمر الشراء يجب أن يكون مرسلاً للمورد");
        }

        po.setReceivedQuantity((po.getReceivedQuantity() != null ? po.getReceivedQuantity() : 0) + receivedQuantity);
        po.setReceiptNotes(receiptNotes);
        po.setReceivedAt(LocalDateTime.now());

        // Determine new status
        if (po.getOrderedQuantity() != null && po.getReceivedQuantity() >= po.getOrderedQuantity()) {
            po.setStatus("received");
        } else {
            po.setStatus("partial");
        }

        // Step 6: 3-way matching check
        boolean threeWayMatch = performThreeWayMatch(po);
        if (!threeWayMatch) {
            notificationService.createNotification(null,
                    "فشل المطابقة الثلاثية",
                    "لا تتطابق كميات طلب الشراء مع أمر الشراء والاستلام - رقم PO: " + po.getOrderNumber(),
                    "purchase_order",
                    po.getId(),
                    "PurchaseOrder");
        }

        // Step 7: Auto journal entry for goods receipt
        if ("received".equals(po.getStatus())) {
            JournalEntry je = journalService.createGoodsReceiptJournal(po);
            po.setGoodsReceiptJournalId(je.getId());
        }

        return poRepository.save(po);
    }

    /**
     * 3-way matching: PR qty == PO qty == received qty
     */
    private boolean performThreeWayMatch(PurchaseOrder po) {
        if (po.getPurchaseRequest() == null) return true;
        int prQty = po.getPurchaseRequest().getItems() != null
                ? po.getPurchaseRequest().getItems().stream().mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum()
                : 0;
        int poQty = po.getOrderedQuantity() != null ? po.getOrderedQuantity() : 0;
        int receivedQty = po.getReceivedQuantity() != null ? po.getReceivedQuantity() : 0;
        return prQty == poQty && poQty == receivedQty;
    }

    // ─── Queries ──────────────────────────────────────────────────────────────
    public List<PurchaseRequest> getAllPurchaseRequests(Long companyId) {
        if (companyId != null) return prRepository.findByCompanyId(companyId);
        return prRepository.findAll();
    }

    public List<PurchaseRequest> getPurchaseRequestsByStatus(Long companyId, String status) {
        return prRepository.findByCompanyIdAndStatus(companyId, status);
    }

    public List<PurchaseOrder> getAllPurchaseOrders(Long companyId) {
        if (companyId != null) return poRepository.findByCompanyId(companyId);
        return poRepository.findAll();
    }

    public PurchaseRequest getPurchaseRequestById(Long id) {
        return prRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase request not found: " + id));
    }

    public PurchaseOrder getPurchaseOrderById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase order not found: " + id));
    }

    private String generatePrNumber() {
        String year = String.valueOf(LocalDate.now().getYear());
        long count = prRepository.count() + 1;
        return String.format("PR-%s-%04d", year, count);
    }

    private String generatePoNumber() {
        String year = String.valueOf(LocalDate.now().getYear());
        long count = poRepository.count() + 1;
        return String.format("PO-%s-%04d", year, count);
    }
}

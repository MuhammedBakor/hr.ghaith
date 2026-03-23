package com.ghaith.erp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "finance_vouchers")
public class Voucher extends BaseEntity {

    @Column(name = "voucher_number")
    private String voucherNumber;

    /** payment, receipt, journal */
    @Column(name = "voucher_type")
    private String voucherType;

    private Double amount;

    private String description;

    /** cash, bank_transfer, check, credit_card, other */
    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "beneficiary_name")
    private String beneficiaryName;

    @Column(name = "beneficiary_account")
    private String beneficiaryAccount;

    @Column(name = "request_id")
    private Long requestId;

    @Column(name = "account_id")
    private Long accountId;

    @Column(name = "debit_account_id")
    private Long debitAccountId;

    @Column(name = "credit_account_id")
    private Long creditAccountId;

    private String notes;

    /** draft, approved, executed, cancelled */
    private String status = "draft";

    @Column(name = "journal_entry_id")
    private Long journalEntryId;
}

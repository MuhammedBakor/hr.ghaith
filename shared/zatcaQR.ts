// ═══ ZATCA e-Invoice QR Code Generator ═══
// Compliant with Saudi ZATCA Phase 1 & 2 requirements

/**
 * TLV (Tag-Length-Value) encoding for ZATCA QR code
 * Required fields per ZATCA specification:
 * Tag 1: Seller Name
 * Tag 2: VAT Registration Number
 * Tag 3: Invoice Date/Time (ISO 8601)
 * Tag 4: Invoice Total (with VAT)
 * Tag 5: VAT Amount
 */
export function encodeTLV(tag: number, value: string): Buffer {
  const valueBytes = Buffer.from(value, 'utf-8');
  return Buffer.concat([
    Buffer.from([tag]),
    Buffer.from([valueBytes.length]),
    valueBytes,
  ]);
}

export interface ZATCAInvoiceData {
  sellerName: string;        // Tag 1: اسم البائع
  vatNumber: string;         // Tag 2: الرقم الضريبي (15 digits)
  invoiceDate: string;       // Tag 3: تاريخ الفاتورة (ISO 8601)
  totalWithVAT: number;      // Tag 4: إجمالي الفاتورة شامل الضريبة
  vatAmount: number;         // Tag 5: مبلغ الضريبة
}

/**
 * Generate ZATCA-compliant QR code data (Base64 encoded TLV)
 */
export function generateZATCAQR(data: ZATCAInvoiceData): string {
  const tlvData = Buffer.concat([
    encodeTLV(1, data.sellerName),
    encodeTLV(2, data.vatNumber),
    encodeTLV(3, data.invoiceDate),
    encodeTLV(4, data.totalWithVAT.toFixed(2)),
    encodeTLV(5, data.vatAmount.toFixed(2)),
  ]);
  
  return tlvData.toString('base64');
}

/**
 * Decode ZATCA QR code data (for verification)
 */
export function decodeZATCAQR(base64Data: string): ZATCAInvoiceData | null {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const result: any = {};
    let offset = 0;
    
    while (offset < buffer.length) {
      const tag = buffer[offset];
      const length = buffer[offset + 1];
      const value = buffer.subarray(offset + 2, offset + 2 + length).toString('utf-8');
      
      switch (tag) {
        case 1: result.sellerName = value; break;
        case 2: result.vatNumber = value; break;
        case 3: result.invoiceDate = value; break;
        case 4: result.totalWithVAT = parseFloat(value); break;
        case 5: result.vatAmount = parseFloat(value); break;
      }
      
      offset += 2 + length;
    }
    
    return result as ZATCAInvoiceData;
  } catch {
    return null;
  }
}

/**
 * Validate ZATCA data before QR generation
 */
export function validateZATCAData(data: ZATCAInvoiceData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.sellerName || data.sellerName.length < 2) errors.push('اسم البائع مطلوب');
  if (!data.vatNumber || !/^3\d{14}$/.test(data.vatNumber)) errors.push('الرقم الضريبي يجب أن يكون 15 رقم يبدأ بـ 3');
  if (!data.invoiceDate) errors.push('تاريخ الفاتورة مطلوب');
  if (data.totalWithVAT <= 0) errors.push('إجمالي الفاتورة يجب أن يكون أكبر من صفر');
  if (data.vatAmount < 0) errors.push('مبلغ الضريبة لا يمكن أن يكون سالباً');
  if (data.vatAmount > data.totalWithVAT) errors.push('الضريبة لا يمكن أن تتجاوز الإجمالي');
  
  return { valid: errors.length === 0, errors };
}

export default { generateZATCAQR, decodeZATCAQR, validateZATCAData, encodeTLV };

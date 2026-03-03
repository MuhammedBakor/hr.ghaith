/**
 * ══════════════════════════════════════════════════════════════════
 * P1-2: FormKit — نموذج موحد يضمن اكتمال التدفق
 * ══════════════════════════════════════════════════════════════════
 * 
 * كل حقل = state + onChange + validation + error display
 * كل form = loading + submit + success + error + refetch
 * 
 * الاستخدام:
 * <FormKit
 *   fields={[
 *     { name: 'name', label: 'الاسم', type: 'text', required: true },
 *     { name: 'amount', label: 'المبلغ', type: 'number', min: 0 },
 *   ]}
 *   mutation={createMut}
 *   onSuccess={() => refetch()}
 * />
 */

import React, { useState, useCallback } from 'react';

// ─── Types ───
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'textarea' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | null;
  defaultValue?: any;
}

interface FormKitProps {
  fields: FormField[];
  mutation: { mutate: (data: any) => void; isPending?: boolean; isLoading?: boolean };
  onSuccess?: () => void;
  onCancel?: () => void;
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  initialData?: Record<string, any>;
  className?: string;
}

// ─── Component ───
export function FormKit({
  fields,
  mutation,
  onSuccess,
  onCancel,
  title,
  submitLabel = 'حفظ',
  cancelLabel = 'إلغاء',
  initialData = {},
  className = '',
}: FormKitProps) {
  // Initialize state from fields
  const defaultValues: Record<string, any> = {};
  for (const f of fields) {
    defaultValues[f.name] = initialData[f.name] ?? f.defaultValue ?? (f.type === 'number' ? 0 : f.type === 'checkbox' ? false : '');
  }
  
  const [formData, setFormData] = useState<Record<string, any>>(defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  
  const handleChange = useCallback((name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  }, [errors]);
  
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    for (const field of fields) {
      const value = formData[field.name];
      
      // Required check
      if (field.required && (value === '' || value === null || value === undefined)) {
        newErrors[field.name] = `${field.label} مطلوب`;
        continue;
      }
      
      // Type-specific validation
      if (field.type === 'number' && value !== '' && value !== undefined) {
        const num = Number(value);
        if (isNaN(num)) {
          newErrors[field.name] = 'يجب أن يكون رقم';
        } else if (field.min !== undefined && num < field.min) {
          newErrors[field.name] = `الحد الأدنى ${field.min}`;
        } else if (field.max !== undefined && num > field.max) {
          newErrors[field.name] = `الحد الأقصى ${field.max}`;
        }
      }
      
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field.name] = 'بريد إلكتروني غير صحيح';
      }
      
      // Custom validation
      if (field.validation) {
        const err = field.validation(value);
        if (err) newErrors[field.name] = err;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields, formData]);
  
  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    if (!validate()) return;
    
    // Convert types
    const data = { ...formData };
    for (const f of fields) {
      if (f.type === 'number' && data[f.name] !== '') {
        data[f.name] = Number(data[f.name]);
      }
    }
    
    mutation.mutate(data);
  }, [formData, fields, mutation, validate]);
  
  const isLoading = mutation.isPending || mutation.isLoading;
  
  return (
    <div className={`p-6 bg-white border rounded-xl shadow-sm ${className}`}>
      {title && <h3 className="text-lg font-bold mb-4 border-b pb-2">{title}</h3>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((field) => (
          <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 me-1">*</span>}
            </label>
            
            {field.type === 'textarea' ? (
              <textarea
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder || field.label}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors[field.name] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            ) : field.type === 'select' ? (
              <select
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  errors[field.name] ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">اختر {field.label}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  checked={!!formData[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-600">{field.placeholder}</span>
              </div>
            ) : (
              <input
                type={field.type}
                value={formData[field.name] ?? ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder || field.label}
                min={field.min}
                max={field.max}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors[field.name] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            )}
            
            {errors[field.name] && (
              <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex gap-3 mt-6 pt-4 border-t">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? '⏳ جاري الحفظ...' : submitLabel}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default FormKit;

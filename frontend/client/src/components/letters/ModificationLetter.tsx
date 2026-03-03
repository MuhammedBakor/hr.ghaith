import { forwardRef } from 'react';

interface ModificationItem {
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
}

interface ModificationLetterProps {
  letterNumber: string;
  letterDate: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  position: string;
  modifications: ModificationItem[];
  modifiedBy: {
    name: string;
    position: string;
    date: string;
  };
  approvedBy: {
    name: string;
    position: string;
    date: string;
    signature?: string;
  };
  reason?: string;
  notes?: string;
  companyName: string;
  branchName?: string;
  letterhead?: string;
  stamp?: string;
}

const ModificationLetter = forwardRef<HTMLDivElement, ModificationLetterProps>(
  ({ 
    letterNumber,
    letterDate,
    employeeName,
    employeeNumber,
    department,
    position,
    modifications,
    modifiedBy,
    approvedBy,
    reason,
    notes,
    companyName,
    branchName,
    letterhead,
    stamp
  }, ref) => {
    return (
      <div 
        ref={ref}
        className="bg-white p-8 max-w-4xl mx-auto"
        style={{ 
          fontFamily: 'Arial, sans-serif',
          direction: 'rtl',
          minHeight: '297mm',
          width: '210mm',
          position: 'relative',
        }}
      >
        {/* الكليشة / الترويسة */}
        {letterhead ? (
          <div className="mb-8">
            <img 
              src={letterhead} 
              alt="ترويسة الشركة" 
              className="w-full h-auto max-h-32 object-contain"
            />
          </div>
        ) : (
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
            <h1 className="text-2xl font-bold text-gray-800">{companyName}</h1>
            {branchName && <p className="text-gray-600">{branchName}</p>}
          </div>
        )}

        {/* معلومات الخطاب */}
        <div className="flex justify-between mb-6 text-sm">
          <div>
            <p><strong>رقم الخطاب:</strong> {letterNumber}</p>
            <p><strong>التاريخ:</strong> {letterDate}</p>
          </div>
          <div className="text-start">
            <p><strong>الموضوع:</strong> خطاب تعديل بيانات موظف</p>
          </div>
        </div>

        {/* عنوان الخطاب */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary inline-block pb-2">
            خطاب تعديل بيانات موظف
          </h2>
        </div>

        {/* بيانات الموظف */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-gray-700 mb-3">بيانات الموظف</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">اسم الموظف:</span>
              <span className="font-medium me-2">{employeeName}</span>
            </div>
            <div>
              <span className="text-gray-500">الرقم الوظيفي:</span>
              <span className="font-medium me-2">{employeeNumber}</span>
            </div>
            <div>
              <span className="text-gray-500">القسم:</span>
              <span className="font-medium me-2">{department}</span>
            </div>
            <div>
              <span className="text-gray-500">المنصب:</span>
              <span className="font-medium me-2">{position}</span>
            </div>
          </div>
        </div>

        {/* سبب التعديل */}
        {reason && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-2">سبب التعديل</h3>
            <p className="text-gray-600 bg-gray-50 p-3 rounded">{reason}</p>
          </div>
        )}

        {/* جدول التعديلات */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-700 mb-3">تفاصيل التعديلات</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-end">الحقل</th>
                <th className="border border-gray-300 p-3 text-end bg-red-50">القيمة السابقة</th>
                <th className="border border-gray-300 p-3 text-end bg-green-50">القيمة الجديدة</th>
              </tr>
            </thead>
            <tbody>
              {modifications.map((mod, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 p-3 font-medium">{mod.fieldLabel}</td>
                  <td className="border border-gray-300 p-3 text-red-600 bg-red-50/50">
                    {mod.oldValue || '-'}
                  </td>
                  <td className="border border-gray-300 p-3 text-green-600 bg-green-50/50">
                    {mod.newValue || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ملاحظات */}
        {notes && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-2">ملاحظات</h3>
            <p className="text-gray-600 bg-gray-50 p-3 rounded">{notes}</p>
          </div>
        )}

        {/* بيانات المعدل والمعتمد */}
        <div className="grid grid-cols-2 gap-8 mt-10">
          {/* بيانات المعدل */}
          <div className="border rounded-lg p-4">
            <h4 className="font-bold text-gray-700 mb-3 text-center border-b pb-2">
              معدل البيانات
            </h4>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">الاسم:</span> {modifiedBy.name}</p>
              <p><span className="text-gray-500">المنصب:</span> {modifiedBy.position}</p>
              <p><span className="text-gray-500">التاريخ:</span> {modifiedBy.date}</p>
            </div>
          </div>

          {/* بيانات المعتمد */}
          <div className="border rounded-lg p-4">
            <h4 className="font-bold text-gray-700 mb-3 text-center border-b pb-2">
              المعتمد
            </h4>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">الاسم:</span> {approvedBy.name}</p>
              <p><span className="text-gray-500">المنصب:</span> {approvedBy.position}</p>
              <p><span className="text-gray-500">التاريخ:</span> {approvedBy.date}</p>
              {approvedBy.signature && (
                <div className="mt-4">
                  <img 
                    src={approvedBy.signature} 
                    alt="التوقيع" 
                    className="h-16 object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* الختم */}
        {stamp && (
          <div className="absolute bottom-20 start-20">
            <img 
              src={stamp} 
              alt="ختم الشركة" 
              className="w-32 h-32 object-contain opacity-80"
            />
          </div>
        )}

        {/* تذييل الصفحة */}
        <div className="absolute bottom-8 start-0 end-0 text-center text-xs text-gray-400 border-t pt-4 mx-8">
          <p>هذا الخطاب صادر من نظام غيث الإلكتروني - رقم المرجع: {letterNumber}</p>
          <p>تاريخ الإصدار: {letterDate}</p>
        </div>
      </div>
    );
  }
);

ModificationLetter.displayName = 'ModificationLetter';

export default ModificationLetter;

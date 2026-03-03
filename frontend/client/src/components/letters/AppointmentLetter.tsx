import { forwardRef } from 'react';

interface AppointmentLetterProps {
  letterNumber: string;
  letterDate: string;
  employeeName: string;
  employeeNumber: string;
  nationalId: string;
  department: string;
  position: string;
  hireDate: string;
  salary?: string;
  contractType?: string;
  approvedBy: {
    name: string;
    position: string;
    signature?: string;
  };
  companyName: string;
  branchName?: string;
  letterhead?: string;
  stamp?: string;
}

const AppointmentLetter = forwardRef<HTMLDivElement, AppointmentLetterProps>(
  ({ 
    letterNumber,
    letterDate,
    employeeName,
    employeeNumber,
    nationalId,
    department,
    position,
    hireDate,
    salary,
    contractType,
    approvedBy,
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
        </div>

        {/* عنوان الخطاب */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary inline-block pb-2">
            خطاب تعيين موظف
          </h2>
        </div>

        {/* نص الخطاب */}
        <div className="mb-8 leading-loose text-gray-700">
          <p className="mb-4">
            بناءً على قرار الإدارة العليا، وبعد استيفاء جميع الإجراءات والمتطلبات اللازمة،
            تم تعيين الموظف/ة المذكور أدناه:
          </p>
        </div>

        {/* بيانات الموظف */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-2 text-gray-500 w-1/3">اسم الموظف:</td>
                <td className="py-2 font-semibold">{employeeName}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">الرقم الوظيفي:</td>
                <td className="py-2 font-semibold">{employeeNumber}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">رقم الهوية:</td>
                <td className="py-2 font-semibold">{nationalId}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">القسم:</td>
                <td className="py-2 font-semibold">{department}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">المنصب الوظيفي:</td>
                <td className="py-2 font-semibold">{position}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">تاريخ التعيين:</td>
                <td className="py-2 font-semibold">{hireDate}</td>
              </tr>
              {contractType && (
                <tr>
                  <td className="py-2 text-gray-500">نوع العقد:</td>
                  <td className="py-2 font-semibold">{contractType}</td>
                </tr>
              )}
              {salary && (
                <tr>
                  <td className="py-2 text-gray-500">الراتب الأساسي:</td>
                  <td className="py-2 font-semibold">{salary} ريال</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* نص ختامي */}
        <div className="mb-8 leading-loose text-gray-700">
          <p>
            نتمنى للموظف/ة التوفيق والنجاح في مهامه الوظيفية، ونأمل أن يكون إضافة قيمة للفريق.
          </p>
        </div>

        {/* التوقيع */}
        <div className="mt-16">
          <div className="w-64 mr-auto">
            <div className="border-t-2 border-gray-300 pt-4">
              <p className="font-bold">{approvedBy.name}</p>
              <p className="text-gray-500">{approvedBy.position}</p>
              {approvedBy.signature && (
                <img 
                  src={approvedBy.signature} 
                  alt="التوقيع" 
                  className="h-16 mt-2 object-contain"
                />
              )}
            </div>
          </div>
        </div>

        {/* الختم */}
        {stamp && (
          <div className="absolute bottom-24 start-20">
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

AppointmentLetter.displayName = 'AppointmentLetter';

export default AppointmentLetter;

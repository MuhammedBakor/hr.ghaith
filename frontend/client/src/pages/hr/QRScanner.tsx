import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useCheckInWithQR } from '@/services/hrService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  QrCode,
  Camera,
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
  Clock,
  User,
  RefreshCw,
} from 'lucide-react';

export default function QRScanner() {
  const { user: currentUser } = useAuth();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<{
    type: 'checkin' | 'checkout';
    time: Date;
    success: boolean;
  } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const checkInMutation = useCheckInWithQR();

  // الحصول على الموقع الحالي
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('خطأ في الحصول على الموقع:', error);
        }
      );
    }
  }, []);

  // تسجيل الحضور يدوياً
  const handleManualSubmit = async () => {
    if (!qrCode.trim()) {
      toast.error('الرجاء إدخال رمز QR');
      return;
    }

    try {
      const data = await checkInMutation.mutateAsync({
        userId: currentUser?.id,
        qrCode: qrCode.trim(),
        latitude: currentLocation?.lat,
        longitude: currentLocation?.lng,
      });

      setLastResult({
        type: data.type as 'checkin' | 'checkout',
        time: new Date(data.time),
        success: true,
      });
      toast.success(
        data.type === 'checkin' ? 'تم تسجيل الحضور بنجاح' : 'تم تسجيل الانصراف بنجاح'
      );
      setQrCode('');
    } catch (error: any) {
      setLastResult(null);
      toast.error(error.message || 'فشل في تسجيل الحضور');
    }
  };

  // بدء الكاميرا للمسح
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsScanning(true);
    } catch (error) {
      toast.error('فشل في الوصول إلى الكاميرا');
    }
  };

  // إيقاف الكاميرا
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // تنظيف عند إلغاء التحميل
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">مسح رمز QR</h2>
          <p className="text-muted-foreground">تسجيل الحضور والانصراف عبر رمز QR</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* مسح QR */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              مسح رمز QR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* الكاميرا */}
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {isScanning ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Camera className="h-16 w-16 mb-4" />
                  <p>اضغط لبدء المسح</p>
                </div>
              )}

              {/* إطار المسح */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-4 border-primary rounded-lg opacity-50" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="h-4 w-4 ms-2" />
                  بدء المسح
                </Button>
              ) : (
                <Button onClick={stopCamera} variant="outline" className="flex-1">
                  <XCircle className="h-4 w-4 ms-2" />
                  إيقاف المسح
                </Button>
              )}
            </div>

            {/* إدخال يدوي */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">أو أدخل الرمز يدوياً:</p>
              <div className="flex gap-2">
                <Input
                  placeholder="أدخل رمز QR"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
                <Button
                  onClick={handleManualSubmit}
                  disabled={checkInMutation.isPending}
                >
                  {checkInMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* النتيجة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              نتيجة التسجيل
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastResult ? (
              <div className="space-y-4">
                <div
                  className={`p-6 rounded-lg text-center ${lastResult.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                    }`}
                >
                  {lastResult.success ? (
                    <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
                  ) : (
                    <XCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
                  )}
                  <h3 className="text-xl font-bold mb-2">
                    {lastResult.type === 'checkin' ? 'تسجيل حضور' : 'تسجيل انصراف'}
                  </h3>
                  <p className="text-muted-foreground">
                    {lastResult.time.toLocaleTimeString('ar-SA')}
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLastResult(null)}
                >
                  <RefreshCw className="h-4 w-4 ms-2" />
                  تسجيل جديد
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <QrCode className="h-16 w-16 mb-4 opacity-50" />
                <p>امسح رمز QR للتسجيل</p>
              </div>
            )}

            {/* معلومات الموقع */}
            {currentLocation && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MapPin, Play, Square, Navigation, Clock, CheckCircle2, Loader2, Route, Timer, StopCircle } from 'lucide-react';

import {
  useStartFieldTracking,
  useEndFieldTracking,
  useRecordTrackingPoint,
  useFieldTrackingSessionsByEmployee
} from "@/services/hrService";

export default function FieldTracking() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [searchTerm, setSearchTerm] = useState('');

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager" || userRole === "general_manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingPoints, setTrackingPoints] = useState<any[]>([]);
  const [stopNotes, setStopNotes] = useState('');
  const [isRecordingStop, setIsRecordingStop] = useState(false);
  const [stopStartTime, setStopStartTime] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const startTrackingMutation = useStartFieldTracking();
  const recordPointMutation = useRecordTrackingPoint();
  const endTrackingMutation = useEndFieldTracking();

  // الحصول على الموقع الحالي
  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true }
      );
    });
  };

  // بدء التتبع
  const handleStartTracking = async () => {
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      const data = await startTrackingMutation.mutateAsync({
        userId: user?.id,
        latitude: location.lat,
        longitude: location.lng,
      });
      setSessionId(data.id);
      setIsTracking(true);
      toast.success('تم بدء التتبع الميداني');

      // بدء مراقبة الموقع
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCurrentLocation(newLocation);

            // تسجيل نقطة كل 5 دقائق
            if (isTracking && sessionId) {
              recordPointMutation.mutate({
                sessionId,
                latitude: newLocation.lat,
                longitude: newLocation.lng,
                pointType: 'checkpoint',
              });
            }
          },
          (err) => console.error(err),
          { enableHighAccuracy: true } as PositionOptions
        );
      }
    } catch (error: any) {
      toast.error(error.message || 'فشل في الحصول على الموقع');
    }
  };

  // إنهاء التتبع
  const handleEndTracking = async () => {
    if (!sessionId || !currentLocation) return;

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    try {
      await endTrackingMutation.mutateAsync({
        sessionId,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
      });
      setIsTracking(false);
      setSessionId(null);
      setTrackingPoints([]);
      toast.success('تم إنهاء التتبع');
    } catch (error: any) {
      toast.error(error.message || 'فشل في إنهاء التتبع');
    }
  };

  // بدء تسجيل توقف
  const handleStartStop = () => {
    setIsRecordingStop(true);
    setStopStartTime(new Date());
  };

  // إنهاء وتسجيل توقف
  const handleEndStop = async () => {
    if (!sessionId || !currentLocation || !stopStartTime) return;

    const stopDuration = Math.round((Date.now() - stopStartTime.getTime()) / 60000);

    try {
      const data = await recordPointMutation.mutateAsync({
        sessionId,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        pointType: 'stop',
        stopDuration,
        notes: stopNotes,
      });

      setTrackingPoints((prev) => [...prev, data]);
      setIsRecordingStop(false);
      setStopStartTime(null);
      setStopNotes('');
      toast.success(`تم تسجيل نقطة توقف (${stopDuration} دقيقة)`);
    } catch (error: any) {
      toast.error(error.message || 'فشل في تسجيل التوقف');
    }
  };

  // تنظيف عند إلغاء التحميل
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">التتبع الميداني</h2>
          <p className="text-muted-foreground">مراقبة وتسجيل تحركات الموظفين الميدانيين في الوقت الفعلي</p>
        </div>
        <div className="flex gap-2">
          {isTracking && (
            <Badge variant="outline" className="flex gap-1 items-center px-3 py-1 bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              تتبع نشط
            </Badge>
          )}
          <Badge variant="secondary" className="px-3 py-1">
            <Clock className="h-4 w-4 me-2" />
            {new Date().toLocaleTimeString('ar-EG')}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* التحكم في التتبع */}
        <Card className="md:col-span-1 shadow-md border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              لوحة التحكم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              {!isTracking ? (
                <Button
                  size="lg"
                  className="w-full h-16 text-lg font-bold gap-2 shadow-lg"
                  onClick={handleStartTracking}
                  disabled={startTrackingMutation.isPending}
                >
                  {startTrackingMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Play className="h-6 w-6" />}
                  بدء التتبع الميداني
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-full h-16 text-lg font-bold gap-2 shadow-lg"
                  onClick={handleEndTracking}
                  disabled={endTrackingMutation.isPending}
                >
                  {endTrackingMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Square className="h-6 w-6" />}
                  إنهاء التتبع
                </Button>
              )}

              {isTracking && (
                <div className="p-4 bg-muted/50 rounded-xl border border-dashed border-primary/20 space-y-4">
                  {!isRecordingStop ? (
                    <Button
                      variant="outline"
                      className="w-full gap-2 bg-background"
                      onClick={handleStartStop}
                    >
                      <StopCircle className="h-4 w-4 text-orange-500" />
                      تسجيل نقطة توقف
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-orange-500" />
                          مدة التوقف:
                        </span>
                        <Badge variant="secondary">جاري الحساب...</Badge>
                      </div>
                      <Textarea
                        placeholder="ملاحظات حول التوقف..."
                        className="bg-background min-h-[80px]"
                        value={stopNotes}
                        onChange={(e) => setStopNotes(e.target.value)}
                      />
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        onClick={handleEndStop}
                        disabled={recordPointMutation.isPending}
                      >
                        {recordPointMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <CheckCircle2 className="h-4 w-4 me-2" />}
                        حفظ وإنهاء التوقف
                      </Button>
                      <Button variant="ghost" className="w-full text-xs" onClick={() => setIsRecordingStop(false)}>
                        إلغاء
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t space-y-3 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>الموقع الحالي:</span>
                <span className="text-foreground font-mono">
                  {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'غير متاح'}
                </span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>إجمالي النقاط المسجلة:</span>
                <Badge variant="outline" className="font-mono">{trackingPoints.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* مسار الرحلة الحالية */}
        <Card className="md:col-span-2 shadow-md border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              النقاط المسجلة في الجلسة الحالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trackingPoints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
                <MapPin className="h-12 w-12 opacity-20" />
                <p>لا توجد نقاط مسجلة بعد لهذه الجلسة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...trackingPoints].reverse().map((point, index) => (
                  <div key={index} className="flex gap-4 items-start p-3 rounded-lg border bg-muted/30">
                    <div className={`mt-1 p-2 rounded-full ${point.pointType === 'stop' ? 'bg-orange-100' : 'bg-primary/10'}`}>
                      {point.pointType === 'stop' ? <StopCircle className="h-4 w-4 text-orange-600" /> : <MapPin className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-bold">{point.pointType === 'stop' ? 'نقطة توقف' : `نقطة المسار #${index + 1}`}</span>
                        <span className="text-muted-foreground">{new Date(point.timestamp || Date.now()).toLocaleTimeString('ar-EG')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        ({point.latitude.toFixed(6)}, {point.longitude.toFixed(6)})
                      </p>
                      {point.notes && (
                        <p className="text-sm mt-1 bg-background p-2 rounded border-s-2 border-orange-500 italic">
                          {point.notes}
                        </p>
                      )}
                    </div>
                    {point.stopDuration && (
                      <Badge variant="secondary" className="mt-1">
                        {point.stopDuration} دقيقة
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

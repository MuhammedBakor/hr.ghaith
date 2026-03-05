import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface LocationTrackerProps {
  trackingType: "attendance" | "field" | "trip" | "delivery";
  entityId?: number;
  employeeId?: number;
  autoStart?: boolean;
  intervalSeconds?: number;
  showMap?: boolean;
  onLocationUpdate?: (lat: number, lng: number) => void;
  className?: string;
}

export function LocationTracker({
  trackingType, entityId, employeeId, autoStart = false,
  intervalSeconds = 30, showMap = true, onLocationUpdate, className,
}: LocationTrackerProps) {
  const [tracking, setTracking] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [fenceStatus, setFenceStatus] = useState<{ withinFence: boolean; distance: number; branchName?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const recordMut = useMutation({
    mutationFn: (data: any) => api.post('/hr/field-tracking/record-point', data).then(res => res.data),
  });

  const checkGeofence = useQuery({
    queryKey: ['geofence-check', employeeId, currentPos?.lat, currentPos?.lng],
    queryFn: () => api.get('/hr/field-tracking/check-geofence', {
      params: { employeeId, latitude: currentPos?.lat, longitude: currentPos?.lng }
    }).then(res => res.data).catch(() => null),
    enabled: !!employeeId && !!currentPos,
  });

  useEffect(() => {
    if (checkGeofence.data) setFenceStatus(checkGeofence.data as any);
  }, [checkGeofence.data]);

  const recordPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError("متصفحك لا يدعم تحديد الموقع");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
        setCurrentPos({ lat: latitude, lng: longitude, accuracy: accuracy || 0 });
        setError(null);

        recordMut.mutate({
          latitude, longitude,
          accuracy: accuracy || undefined,
          altitude: altitude || undefined,
          speed: speed || undefined,
          heading: heading || undefined,
          trackingType,
          entityId,
          deviceInfo: navigator.userAgent.slice(0, 200),
        });

        onLocationUpdate?.(latitude, longitude);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("يرجى السماح بالوصول للموقع من إعدادات المتصفح");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("الموقع غير متاح حالياً");
            break;
          case err.TIMEOUT:
            setError("انتهى وقت الاستجابة — حاول مرة أخرى");
            break;
          default:
            setError("خطأ في تحديد الموقع");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  }, [trackingType, entityId, onLocationUpdate]);

  const startTracking = useCallback(() => {
    setTracking(true);
    recordPosition();
    intervalRef.current = setInterval(recordPosition, intervalSeconds * 1000);
    toast.success("تم تفعيل تتبع الموقع");
  }, [recordPosition, intervalSeconds]);

  const stopTracking = useCallback(() => {
    setTracking(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    toast.info("تم إيقاف تتبع الموقع");
  }, []);

  useEffect(() => {
    if (autoStart) startTracking();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoStart]);

  return (
    <div className={`space-y-3 ${className || ''}`}>
      {/* Status Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant={tracking ? "default" : "secondary"} className="gap-1">
          {tracking ? (
            <><Navigation className="h-3 w-3 animate-pulse" /> يتتبع</>
          ) : (
            <><MapPin className="h-3 w-3" /> متوقف</>
          )}
        </Badge>

        {currentPos && (
          <Badge variant="outline" className="gap-1 text-xs">
            {currentPos.lat.toFixed(5)}, {currentPos.lng.toFixed(5)}
            {currentPos.accuracy > 0 && ` (${Math.round(currentPos.accuracy)}م)`}
          </Badge>
        )}

        {fenceStatus && (
          <Badge variant={fenceStatus.withinFence ? "default" : "destructive"} className="gap-1">
            {fenceStatus.withinFence ? (
              <><CheckCircle className="h-3 w-3" /> داخل النطاق</>
            ) : (
              <><AlertTriangle className="h-3 w-3" /> خارج النطاق ({fenceStatus.distance}م)</>
            )}
            {fenceStatus.branchName && ` — ${fenceStatus.branchName}`}
          </Badge>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-2 rounded flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!tracking ? (
          <Button onClick={startTracking} size="sm" className="gap-1">
            <Navigation className="h-4 w-4" />
            تفعيل التتبع
          </Button>
        ) : (
          <Button onClick={stopTracking} variant="destructive" size="sm" className="gap-1">
            إيقاف التتبع
          </Button>
        )}
        <Button onClick={recordPosition} variant="outline" size="sm" disabled={recordMut.isPending}>
          {recordMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          <span className="me-1">تحديث الموقع</span>
        </Button>
      </div>
    </div>
  );
}

// Live Map Component
interface LiveMapProps {
  branchId?: number;
  className?: string;
}

export function LivePositionsPanel({ branchId, className }: LiveMapProps) {
  const { data: positions, isLoading, refetch } = useQuery<any[]>({
    queryKey: ['live-positions', branchId],
    queryFn: () => api.get('/hr/field-tracking/live-positions', { params: { branchId } }).then(res => res.data).catch(() => []),
    refetchInterval: 30000,
  });

  return (
    <div className={`border rounded-lg p-4 ${className || ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-500" />
          المواقع الحية
        </h3>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          تحديث
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : !positions || positions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">لا توجد مواقع نشطة</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {positions.map((pos: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/50 text-sm">
              <MapPin className="h-4 w-4 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">موظف #{pos.employeeId}</div>
                <div className="text-xs text-muted-foreground">
                  {parseFloat(pos.latitude).toFixed(4)}, {parseFloat(pos.longitude).toFixed(4)}
                  {pos.recordedAt && ` — ${new Date(pos.recordedAt).toLocaleTimeString('ar-SA')}`}
                </div>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">{pos.trackingType}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

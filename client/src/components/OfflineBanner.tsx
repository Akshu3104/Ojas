/**
 * Offline banner — listens for `online` / `offline` window events and shows
 * a sticky banner when connectivity drops. Self-dismisses when reconnected.
 */
import * as React from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner(): React.ReactElement | null {
  const [online, setOnline] = React.useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  React.useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  if (online) return null;
  return (
    <div
      role="alert"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500/95 px-4 py-2 text-sm font-medium text-white shadow"
    >
      <WifiOff className="h-4 w-4" />
      You're offline — changes are paused until your connection returns.
    </div>
  );
}

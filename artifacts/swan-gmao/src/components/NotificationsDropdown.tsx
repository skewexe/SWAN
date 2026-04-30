import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetNotifications } from "@workspace/api-client-react";
import { Bell, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const TYPE_ICON = {
  critical: { Icon: AlertTriangle, className: "text-red-400", bg: "bg-red-500/10" },
  warning: { Icon: AlertCircle, className: "text-yellow-400", bg: "bg-yellow-500/10" },
  info: { Icon: Info, className: "text-blue-400", bg: "bg-blue-500/10" },
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `Il y a ${hours}h`;
  if (minutes > 0) return `Il y a ${minutes}min`;
  return "À l'instant";
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const { data: allNotifications, isLoading } = useGetNotifications({
    query: { refetchInterval: 30000 },
  });

  const notifications = (allNotifications || []).filter(n => !dismissed.has(n.id));
  const count = notifications.length;

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const dismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(prev => new Set([...prev, id]));
  };

  const dismissAll = () => {
    setDismissed(new Set((allNotifications || []).map(n => n.id)));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(v => !v)}
        data-testid="button-notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-96 bg-card border border-border/70 rounded-2xl shadow-2xl z-50 overflow-hidden"
            data-testid="notifications-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                {count > 0 && (
                  <span className="text-xs bg-destructive/10 text-destructive border border-destructive/30 px-2 py-0.5 rounded-full font-medium">
                    {count}
                  </span>
                )}
              </div>
              {count > 0 && (
                <button
                  onClick={dismissAll}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-dismiss-all"
                >
                  Tout effacer
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Chargement...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground">Aucune notification</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Tout est en ordre</p>
                </div>
              ) : (
                <div>
                  {notifications.map((n, idx) => {
                    const config = TYPE_ICON[n.type as keyof typeof TYPE_ICON] || TYPE_ICON.info;
                    const { Icon } = config;
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-start gap-3 px-5 py-3.5 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors group"
                        data-testid={`notification-${n.id}`}
                      >
                        <div className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon className={`h-4 w-4 ${config.className}`} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-xs text-muted-foreground/50 mt-1">{timeAgo(n.timestamp)}</p>
                        </div>
                        <button
                          onClick={(e) => dismiss(n.id, e)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                          data-testid={`button-dismiss-${n.id}`}
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

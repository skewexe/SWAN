import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, WifiOff, QrCode, Plus, Trash2,
  Send, RefreshCw, Users, ScrollText, CheckCircle,
  AlertTriangle, Clock, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const GATEWAY_BASE = "/whatsapp";

type GatewayStatus = "disconnected" | "initializing" | "qr_ready" | "connected";
type LogEntry = { type: string; phone: string; text: string; reply: string; timestamp: string };
type AllowedNumber = { phone: string; name: string; addedAt: string };

const STATUS_CFG: Record<GatewayStatus, { label: string; color: string; Icon: React.ComponentType<any> }> = {
  disconnected: { label: "Déconnecté",     color: "bg-red-500/10 text-red-400 border-red-500/30",    Icon: WifiOff },
  initializing: { label: "Initialisation…", color: "bg-amber-500/10 text-amber-400 border-amber-500/30", Icon: RefreshCw },
  qr_ready:     { label: "Scan QR requis", color: "bg-blue-500/10 text-blue-400 border-blue-500/30",  Icon: QrCode },
  connected:    { label: "Connecté",       color: "bg-green-500/10 text-green-400 border-green-500/30", Icon: CheckCircle },
};

const LOG_ICON: Record<string, { Icon: React.ComponentType<any>; color: string }> = {
  ticket_created: { Icon: CheckCircle,    color: "text-green-400" },
  status_query:   { Icon: Clock,          color: "text-blue-400" },
  blocked:        { Icon: AlertTriangle,  color: "text-red-400" },
  error:          { Icon: AlertTriangle,  color: "text-amber-400" },
  unknown:        { Icon: MessageSquare,  color: "text-muted-foreground" },
  help:           { Icon: MessageSquare,  color: "text-purple-400" },
};

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${GATEWAY_BASE}${path}`, opts);
  return res;
}

export default function WhatsAppPage() {
  const [status, setStatus]       = useState<GatewayStatus>("disconnected");
  const [qrImage, setQrImage]     = useState<string | null>(null);
  const [numbers, setNumbers]     = useState<AllowedNumber[]>([]);
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [newPhone, setNewPhone]   = useState("");
  const [newName, setNewName]     = useState("");
  const [sendPhone, setSendPhone] = useState("");
  const [sendMsg, setSendMsg]     = useState("");
  const [sending, setSending]     = useState(false);
  const [tab, setTab]             = useState<"qr" | "numbers" | "send" | "logs">("qr");
  const [gatewayUp, setGatewayUp] = useState(false);
  const { toast } = useToast();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/status");
      if (!res.ok) { setGatewayUp(false); return; }
      const d = await res.json();
      setStatus(d.status);
      setGatewayUp(true);
    } catch { setGatewayUp(false); }
  }, []);

  const fetchQR = useCallback(async () => {
    try {
      const res = await apiFetch("/qr");
      if (!res.ok) return;
      const d = await res.json();
      setQrImage(d.qr || null);
      if (d.status) setStatus(d.status);
    } catch {}
  }, []);

  const fetchNumbers = useCallback(async () => {
    try {
      const res = await apiFetch("/numbers");
      if (!res.ok) return;
      setNumbers(await res.json());
    } catch {}
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await apiFetch("/logs");
      if (!res.ok) return;
      setLogs(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchNumbers();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
      if (status === "qr_ready") fetchQR();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchQR, fetchNumbers, fetchLogs, status]);

  useEffect(() => {
    if (tab === "qr") fetchQR();
    if (tab === "numbers") fetchNumbers();
    if (tab === "logs") fetchLogs();
  }, [tab, fetchQR, fetchNumbers, fetchLogs]);

  const addNumber = async () => {
    if (!newPhone.trim()) return;
    try {
      const res = await apiFetch("/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newPhone.trim(), name: newName.trim() || newPhone.trim() }),
      });
      if (!res.ok) { const e = await res.json(); toast({ title: e.error || "Erreur", variant: "destructive" }); return; }
      setNewPhone(""); setNewName("");
      toast({ title: "Numéro ajouté" });
      fetchNumbers();
    } catch { toast({ title: "Service indisponible", variant: "destructive" }); }
  };

  const removeNumber = async (phone: string) => {
    await apiFetch(`/numbers/${phone}`, { method: "DELETE" });
    toast({ title: "Numéro supprimé" });
    fetchNumbers();
  };

  const sendNotification = async () => {
    if (!sendPhone.trim() || !sendMsg.trim()) return;
    setSending(true);
    try {
      const res = await apiFetch("/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: sendPhone.trim(), message: sendMsg.trim() }),
      });
      if (!res.ok) { const e = await res.json(); toast({ title: e.error || "Erreur d'envoi", variant: "destructive" }); }
      else { toast({ title: "Message envoyé" }); setSendMsg(""); }
    } catch { toast({ title: "Service indisponible", variant: "destructive" }); }
    finally { setSending(false); }
  };

  const cfg = STATUS_CFG[status] ?? STATUS_CFG.disconnected;
  const StatusIcon = cfg.Icon;

  const TABS = [
    { key: "qr"      as const, label: "Connexion QR" },
    { key: "numbers" as const, label: "Numéros autorisés" },
    { key: "send"    as const, label: "Envoyer" },
    { key: "logs"    as const, label: "Journaux" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Intégrations</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">WhatsApp Gateway</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Canal secondaire GMAO ↔ WhatsApp — Bridge léger, sans modifier le système principal</p>
        </div>
        <div className="flex items-center gap-3">
          {!gatewayUp && (
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full">
              Service hors ligne
            </span>
          )}
          <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.color}`}>
            <StatusIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
        <MessageSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
        <div>
          <span className="font-medium text-foreground">Pont de communication secondaire</span> — Les techniciens créent des OT et consultent leur statut via WhatsApp.
          Commandes: <code className="bg-card/80 px-1.5 py-0.5 rounded text-xs mx-0.5">panne [description]</code>
          <code className="bg-card/80 px-1.5 py-0.5 rounded text-xs mx-0.5">status [id]</code>
          <code className="bg-card/80 px-1.5 py-0.5 rounded text-xs mx-0.5">urgent [description]</code>
          <code className="bg-card/80 px-1.5 py-0.5 rounded text-xs mx-0.5">aide</code>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card/40 border border-border/60 rounded-2xl w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${tab === t.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >{t.label}</button>
        ))}
      </div>

      {/* QR Tab */}
      {tab === "qr" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border/60 rounded-3xl p-6 flex flex-col items-center justify-center min-h-72">
            {status === "connected" ? (
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-400" strokeWidth={1.5} />
                </div>
                <p className="font-semibold text-foreground text-lg">WhatsApp connecté</p>
                <p className="text-sm text-muted-foreground mt-2">Le service est actif et traite les messages entrants.</p>
              </div>
            ) : qrImage ? (
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground mb-4">Scannez avec WhatsApp</p>
                <img src={qrImage} alt="WhatsApp QR Code" className="h-60 w-60 rounded-2xl border border-border/60 bg-white p-2 mx-auto" />
                <p className="text-xs text-muted-foreground mt-3">WhatsApp → ⋮ → Appareils liés → Lier un appareil</p>
                <Button variant="ghost" size="sm" onClick={fetchQR} className="mt-2 gap-2 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} /> Actualiser
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <QrCode className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <p className="font-semibold text-foreground">
                  {status === "initializing" ? "Initialisation en cours…" : gatewayUp ? "En attente du QR code…" : "Service WhatsApp Gateway hors ligne"}
                </p>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                  {gatewayUp ? "Le QR code apparaîtra ici dès qu'il sera prêt." : "Démarrez le workflow \"WhatsApp Gateway\" dans l'environnement Replit."}
                </p>
                <Button variant="outline" size="sm" onClick={fetchStatus} className="mt-3 gap-2 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} /> Vérifier
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border/60 rounded-3xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Instructions de connexion</h3>
              <ol className="space-y-2.5 text-sm text-muted-foreground">
                {[
                  "Démarrer le workflow WhatsApp Gateway",
                  "Attendre l'apparition du QR code",
                  "Ouvrir WhatsApp sur votre téléphone",
                  "Menu → Appareils liés → Lier un appareil",
                  "Scanner le QR code avec la caméra",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-card border border-border/60 rounded-3xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Commandes WhatsApp</h3>
              <div className="space-y-2">
                {[
                  { cmd: "panne pompe 2",           desc: "Crée un OT correctif" },
                  { cmd: "urgent hs compresseur",   desc: "OT priorité haute" },
                  { cmd: "status 42",               desc: "Consulter l'OT #42" },
                  { cmd: "aide",                    desc: "Afficher l'aide" },
                ].map(({ cmd, desc }) => (
                  <div key={cmd} className="flex items-center gap-3">
                    <code className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-mono shrink-0">{cmd}</code>
                    <span className="text-xs text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Numbers Tab */}
      {tab === "numbers" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-card border border-border/60 rounded-3xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Ajouter un numéro autorisé</h3>
            <div className="flex gap-3 flex-wrap">
              <Input placeholder="Ex: 213551234567" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="flex-1 min-w-40" onKeyDown={e => e.key === "Enter" && addNumber()} />
              <Input placeholder="Nom (optionnel)" value={newName} onChange={e => setNewName(e.target.value)} className="w-44" />
              <Button onClick={addNumber} className="gap-2 rounded-full">
                <Plus className="h-4 w-4" strokeWidth={1.5} /> Ajouter
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Format : indicatif pays + numéro, sans espaces. Ex: 213551234567 (Algérie +213)</p>
          </div>

          <div className="bg-card border border-border/60 rounded-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" strokeWidth={1.5} />
                Numéros autorisés ({numbers.length})
              </h3>
            </div>
            {numbers.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-400/50" strokeWidth={1} />
                Aucun numéro autorisé — tous les messages WhatsApp seront rejetés.
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {numbers.map((n, i) => (
                    <motion.tr key={n.phone} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Phone className="h-4 w-4 text-primary" strokeWidth={1.5} />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{n.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">+{n.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">Ajouté le {new Date(n.addedAt).toLocaleDateString("fr-DZ")}</td>
                      <td className="px-6 py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeNumber(n.phone)}>
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      )}

      {/* Send Tab */}
      {tab === "send" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg">
          <div className="bg-card border border-border/60 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" strokeWidth={1.5} />
              Envoyer une notification WhatsApp
            </h3>
            {status !== "connected" && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                WhatsApp non connecté — scannez le QR code d'abord.
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Numéro destinataire</label>
                <Input placeholder="213551234567" value={sendPhone} onChange={e => setSendPhone(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message</label>
                <textarea
                  value={sendMsg} onChange={e => setSendMsg(e.target.value)}
                  placeholder="Votre message de notification..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm bg-background border border-border/60 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                />
              </div>
              <Button onClick={sendNotification} disabled={sending || status !== "connected"} className="w-full gap-2 rounded-full">
                <Send className="h-4 w-4" strokeWidth={1.5} />
                {sending ? "Envoi…" : "Envoyer le message"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Logs Tab */}
      {tab === "logs" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-card border border-border/60 rounded-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-primary" strokeWidth={1.5} />
                Journal des messages ({logs.length})
              </h3>
              <Button variant="ghost" size="sm" onClick={fetchLogs} className="gap-2 text-xs">
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} /> Actualiser
              </Button>
            </div>
            {logs.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <ScrollText className="h-6 w-6 mx-auto mb-2 opacity-30" strokeWidth={1} />
                Aucun message traité pour le moment.
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {logs.map((log, i) => {
                  const l = LOG_ICON[log.type] ?? LOG_ICON.unknown;
                  const Icon = l.Icon;
                  return (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${l.color}`} strokeWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-primary">+{log.phone}</span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString("fr-DZ")}</span>
                          </div>
                          <p className="text-sm text-foreground mt-1">{log.text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.reply}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

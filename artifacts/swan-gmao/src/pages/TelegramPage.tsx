import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, WifiOff, Settings, Plus, Trash2, Send,
  RefreshCw, Users, ScrollText, CheckCircle, AlertTriangle,
  Bot, ChevronRight, ArrowUpRight, ArrowDownLeft, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type ConnectionStatus = "unconfigured" | "connected" | "error";

interface Chat { id: number; chatId: string; name: string; type: string; allowed: boolean; addedAt: string; }
interface LogEntry { id: number; chatId: string; direction: string; text: string; eventType: string; reply: string | null; timestamp: string; }

async function api(path: string, opts?: RequestInit) {
  const res = await fetch(`/api${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  return res;
}

const TAB_LIST = [
  { key: "config", label: "Configuration", Icon: Settings },
  { key: "chats", label: "Chats autorisés", Icon: Users },
  { key: "send", label: "Envoyer", Icon: Send },
  { key: "logs", label: "Journaux", Icon: ScrollText },
];

export default function TelegramPage() {
  const [status, setStatus] = useState<ConnectionStatus>("unconfigured");
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tab, setTab] = useState<"config" | "chats" | "send" | "logs">("config");
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [newChatId, setNewChatId] = useState("");
  const [newChatName, setNewChatName] = useState("");
  const [sendChatId, setSendChatId] = useState("");
  const [sendMsg, setSendMsg] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api("/telegram/config");
      if (!res.ok) { setStatus("error"); return; }
      const d = await res.json();
      if (d.configured) { setStatus("connected"); setBotUsername(d.botUsername); }
      else setStatus("unconfigured");
    } catch { setStatus("error"); }
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const res = await api("/telegram/chats");
      if (res.ok) setChats(await res.json());
    } catch {}
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api("/telegram/logs");
      if (res.ok) setLogs(await res.json());
    } catch {}
  }, []);

  useEffect(() => { fetchConfig(); fetchChats(); fetchLogs(); }, [fetchConfig, fetchChats, fetchLogs]);

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return;
    setSavingToken(true);
    try {
      const res = await api("/telegram/config", {
        method: "PUT",
        body: JSON.stringify({ botToken: tokenInput.trim() }),
      });
      const d = await res.json();
      if (res.ok) {
        toast({ title: `Bot @${d.botUsername} configuré avec succès` });
        setBotUsername(d.botUsername);
        setStatus("connected");
        setTokenInput("");
      } else {
        toast({ title: d.error || "Token invalide", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive" });
    } finally {
      setSavingToken(false);
    }
  };

  const handleAddChat = async () => {
    if (!newChatId.trim() || !newChatName.trim()) {
      toast({ title: "Chat ID et nom requis", variant: "destructive" }); return;
    }
    const res = await api("/telegram/chats", {
      method: "POST",
      body: JSON.stringify({ chatId: newChatId.trim(), name: newChatName.trim() }),
    });
    if (res.ok) {
      toast({ title: "Chat ajouté" });
      setNewChatId(""); setNewChatName("");
      fetchChats();
    } else {
      toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
    }
  };

  const handleDeleteChat = async (id: number) => {
    await api(`/telegram/chats/${id}`, { method: "DELETE" });
    fetchChats();
  };

  const handleSend = async () => {
    if (!sendChatId.trim() || !sendMsg.trim()) {
      toast({ title: "Sélectionnez un destinataire et saisissez un message", variant: "destructive" }); return;
    }
    setSending(true);
    try {
      const res = await api("/telegram/send", {
        method: "POST",
        body: JSON.stringify({ chatId: sendChatId, message: sendMsg }),
      });
      const d = await res.json();
      if (res.ok) {
        toast({ title: "Message envoyé" });
        setSendMsg("");
        fetchLogs();
      } else {
        toast({ title: d.error || "Échec de l'envoi", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const STATUS_CFG: Record<ConnectionStatus, { label: string; color: string; Icon: React.ComponentType<any> }> = {
    unconfigured: { label: "Non configuré",   color: "bg-muted text-muted-foreground border-border",          Icon: WifiOff },
    connected:    { label: "Connecté",         color: "bg-green-500/10 text-green-400 border-green-500/30",   Icon: CheckCircle },
    error:        { label: "Erreur",           color: "bg-red-500/10 text-red-400 border-red-500/30",         Icon: AlertTriangle },
  };

  const cfg = STATUS_CFG[status];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Messagerie</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Telegram Gateway</h1>
        <p className="text-sm text-muted-foreground mt-1">Intégration Telegram Bot pour notifications et création automatique d'OT</p>
      </div>

      {/* Status banner */}
      <div className="flex items-center justify-between bg-card border border-border/50 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {botUsername ? `@${botUsername}` : "Bot Telegram"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {status === "connected" ? `${chats.length} chat(s) autorisé(s)` : "Configurez votre bot avec BotFather"}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color}`}>
          <cfg.Icon className="h-3.5 w-3.5" strokeWidth={2} />
          {cfg.label}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card/50 border border-border/50 rounded-2xl p-1">
        {TAB_LIST.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              tab === key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      {/* Config tab */}
      {tab === "config" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-foreground">Configuration du Bot Token</h3>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Comment obtenir un Bot Token :</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Ouvrez Telegram et cherchez <span className="font-mono text-primary">@BotFather</span></li>
                <li>Envoyez <span className="font-mono">/newbot</span> et suivez les instructions</li>
                <li>BotFather vous donnera un token du format <span className="font-mono">123456:ABC-DEF...</span></li>
                <li>Collez-le ci-dessous et cliquez Enregistrer</li>
              </ol>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showToken ? "text" : "password"}
                  placeholder="Votre Bot Token (ex: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSaveToken()}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={handleSaveToken} disabled={savingToken || !tokenInput.trim()} className="rounded-full shrink-0">
                {savingToken ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Enregistrer"}
              </Button>
            </div>
            {status === "connected" && botUsername && (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />
                Bot actif : @{botUsername}
              </div>
            )}
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Fonctionnalités disponibles</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Création d'OT par message", desc: "Envoyez « OT: [titre] » pour créer un ordre de travail" },
                { label: "Interrogation de statut", desc: "Demandez le statut d'un OT par son numéro" },
                { label: "Notifications push", desc: "Recevez les alertes stock et OT critiques" },
                { label: "Alerte stock faible", desc: "Notification automatique sous le seuil minimum" },
              ].map(f => (
                <div key={f.label} className="bg-background/50 border border-border/40 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ChevronRight className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                    <p className="text-xs font-medium text-foreground">{f.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Chats tab */}
      {tab === "chats" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Ajouter un chat autorisé</h3>
            <p className="text-xs text-muted-foreground">Pour trouver votre Chat ID, utilisez <span className="font-mono text-primary">@userinfobot</span> sur Telegram.</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Chat ID (ex: -1001234567890)" value={newChatId} onChange={e => setNewChatId(e.target.value)} className="text-sm" />
              <Input placeholder="Nom (ex: Jean Dupont)" value={newChatName} onChange={e => setNewChatName(e.target.value)} className="text-sm" />
            </div>
            <Button onClick={handleAddChat} disabled={!newChatId || !newChatName} className="rounded-full gap-1.5">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Ajouter
            </Button>
          </div>

          <div className="space-y-2">
            {chats.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground border border-border/30 rounded-2xl bg-card/30">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" strokeWidth={1} />
                Aucun chat autorisé
              </div>
            ) : chats.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center gap-3 bg-card border border-border/40 rounded-2xl px-4 py-3"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{c.chatId}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${c.allowed ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-muted text-muted-foreground border-border"}`}>
                  {c.allowed ? "Autorisé" : "Bloqué"}
                </span>
                <button
                  onClick={() => handleDeleteChat(c.id)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Send tab */}
      {tab === "send" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Envoyer un message</h3>
            {chats.length > 0 ? (
              <select
                value={sendChatId}
                onChange={e => setSendChatId(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Sélectionner un destinataire…</option>
                {chats.map(c => (
                  <option key={c.id} value={c.chatId}>{c.name} ({c.chatId})</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber-400">Aucun chat autorisé. Ajoutez d'abord un chat dans l'onglet "Chats autorisés".</p>
            )}
            <textarea
              placeholder="Votre message…"
              value={sendMsg}
              onChange={e => setSendMsg(e.target.value)}
              rows={4}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <Button onClick={handleSend} disabled={sending || !sendChatId || !sendMsg} className="rounded-full gap-1.5">
              {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" strokeWidth={1.5} />}
              Envoyer
            </Button>
          </div>
        </motion.div>
      )}

      {/* Logs tab */}
      {tab === "logs" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{logs.length} message(s)</p>
            <Button variant="ghost" size="sm" className="gap-1.5 rounded-full" onClick={fetchLogs}>
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
              Actualiser
            </Button>
          </div>
          {logs.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground border border-border/30 rounded-2xl bg-card/30">
              <ScrollText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" strokeWidth={1} />
              Aucun journal disponible
            </div>
          ) : [...logs].reverse().map((l, idx) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex items-start gap-3 bg-card border border-border/40 rounded-2xl px-4 py-3"
            >
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${l.direction === "out" ? "bg-primary/10" : "bg-green-500/10"}`}>
                {l.direction === "out"
                  ? <ArrowUpRight className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                  : <ArrowDownLeft className="h-3.5 w-3.5 text-green-400" strokeWidth={2} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono text-muted-foreground">{l.chatId}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{new Date(l.timestamp).toLocaleString("fr-DZ")}</span>
                </div>
                <p className="text-sm text-foreground">{l.text}</p>
                {l.reply && <p className="text-xs text-muted-foreground mt-0.5 italic">Réponse : {l.reply}</p>}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{l.eventType}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

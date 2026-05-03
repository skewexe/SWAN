import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetAssets } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Map, Plus, Upload, Trash2, Pencil, X, ZoomIn, ZoomOut, Move,
  Pin, Wrench, AlertTriangle, CheckCircle2, Clock, Save, ImageIcon,
  Building2, ChevronDown, ChevronRight, Eye, EyeOff, Layers, Download,
  RotateCcw, Maximize2, RefreshCw,
} from "lucide-react";
import { useRBAC } from "@/context/RBACContext";

const SITEMAP_STORAGE_KEY = "swan_sitemaps_v2";

type MarkerStatus = "operational" | "maintenance" | "breakdown" | "unknown";
type DrawMode = "select" | "pin" | "zone" | "pan";

interface SiteMarker {
  id: string;
  x: number;
  y: number;
  label: string;
  assetId?: number;
  assetName?: string;
  status: MarkerStatus;
  note?: string;
}

interface SiteZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
}

interface SiteMapData {
  id: string;
  name: string;
  description?: string;
  backgroundImage?: string;
  markers: SiteMarker[];
  zones: SiteZone[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_META: Record<MarkerStatus, { color: string; bg: string; label: string; Icon: any }> = {
  operational: { color: "#22C55E", bg: "#22C55E20", label: "Opérationnel",   Icon: CheckCircle2 },
  maintenance:  { color: "#F59E0B", bg: "#F59E0B20", label: "Maintenance",    Icon: Clock },
  breakdown:    { color: "#EF4444", bg: "#EF444420", label: "En panne",       Icon: AlertTriangle },
  unknown:      { color: "#94A3B8", bg: "#94A3B820", label: "Inconnu",        Icon: Wrench },
};

const ZONE_COLORS = [
  "#0A6DFF40", "#22C55E40", "#F59E0B40", "#EF444440", "#8B5CF640", "#38BDF840",
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function loadMaps(): SiteMapData[] {
  try {
    const raw = localStorage.getItem(SITEMAP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMaps(maps: SiteMapData[]) {
  localStorage.setItem(SITEMAP_STORAGE_KEY, JSON.stringify(maps));
}

export default function SiteMapPage() {
  const { isReadOnly } = useRBAC();
  const { data: assets } = useGetAssets({});
  const { toast } = useToast();

  const [maps, setMaps] = useState<SiteMapData[]>(() => loadMaps());
  const [activeMapId, setActiveMapId] = useState<string | null>(() => {
    const saved = loadMaps();
    return saved.length > 0 ? saved[0].id : null;
  });

  const activeMap = useMemo(() => maps.find(m => m.id === activeMapId) ?? null, [maps, activeMapId]);

  const [drawMode, setDrawMode] = useState<DrawMode>("select");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ mx: 0, my: 0, px: 0, py: 0 });

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [markerDragOffset, setMarkerDragOffset] = useState({ dx: 0, dy: 0 });

  const [zoneDrawStart, setZoneDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [zoneDrawCurrent, setZoneDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  const [showMarkerDialog, setShowMarkerDialog] = useState(false);
  const [editMarker, setEditMarker] = useState<Partial<SiteMarker> | null>(null);
  const [pendingMarkerPos, setPendingMarkerPos] = useState<{ x: number; y: number } | null>(null);

  const [showNewMapDialog, setShowNewMapDialog] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [newMapDesc, setNewMapDesc] = useState("");

  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const [pendingZone, setPendingZone] = useState<Omit<SiteZone, "id"> | null>(null);
  const [zoneLabel, setZoneLabel] = useState("");
  const [zoneColorIdx, setZoneColorIdx] = useState(0);

  const [showMarkers, setShowMarkers] = useState(true);
  const [showZones, setShowZones] = useState(true);

  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const persist = useCallback((updated: SiteMapData[]) => {
    setMaps(updated);
    saveMaps(updated);
  }, []);

  const updateActiveMap = useCallback((updater: (m: SiteMapData) => SiteMapData) => {
    persist(maps.map(m => m.id === activeMapId ? { ...updater(m), updatedAt: new Date().toISOString() } : m));
  }, [maps, activeMapId, persist]);

  const createMap = () => {
    if (!newMapName.trim()) return;
    const m: SiteMapData = {
      id: genId(),
      name: newMapName.trim(),
      description: newMapDesc.trim() || undefined,
      markers: [],
      zones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...maps, m];
    persist(updated);
    setActiveMapId(m.id);
    setNewMapName("");
    setNewMapDesc("");
    setShowNewMapDialog(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    toast({ title: "Plan créé", description: `"${m.name}" prêt à éditer.` });
  };

  const deleteMap = (id: string) => {
    const updated = maps.filter(m => m.id !== id);
    persist(updated);
    if (activeMapId === id) setActiveMapId(updated[0]?.id ?? null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeMap) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateActiveMap(m => ({ ...m, backgroundImage: ev.target?.result as string }));
      toast({ title: "Image chargée", description: "Fond de plan mis à jour." });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const mapPointFromEvent = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  }, [pan.x, pan.y, zoom]);

  const svgToMap = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  }, [pan, zoom]);

  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest("[data-marker], [data-zone], [data-toolbar]")) return;

    if (drawMode === "pan") {
      setIsPanning(true);
      setPanStart({ mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y });
      return;
    }
    if (drawMode === "zone") {
      const pos = svgToMap(e.clientX, e.clientY);
      setZoneDrawStart(pos);
      setZoneDrawCurrent(pos);
      return;
    }
    if (drawMode === "pin") {
      const pos = mapPointFromEvent(e);
      setPendingMarkerPos(pos);
      setEditMarker({ x: pos.x, y: pos.y, label: "", status: "unknown" });
      setShowMarkerDialog(true);
      return;
    }
    setSelectedMarkerId(null);
    setSelectedZoneId(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPan({ x: panStart.px + (e.clientX - panStart.mx), y: panStart.py + (e.clientY - panStart.my) });
      return;
    }
    if (draggingMarkerId && activeMap) {
      const pos = mapPointFromEvent(e);
      updateActiveMap(m => ({
        ...m,
        markers: m.markers.map(mk =>
          mk.id === draggingMarkerId ? { ...mk, x: pos.x - markerDragOffset.dx, y: pos.y - markerDragOffset.dy } : mk
        ),
      }));
      return;
    }
    if (drawMode === "zone" && zoneDrawStart) {
      setZoneDrawCurrent(mapPointFromEvent(e));
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) { setIsPanning(false); return; }
    if (draggingMarkerId) { setDraggingMarkerId(null); return; }
    if (drawMode === "zone" && zoneDrawStart && zoneDrawCurrent) {
      const x = Math.min(zoneDrawStart.x, zoneDrawCurrent.x);
      const y = Math.min(zoneDrawStart.y, zoneDrawCurrent.y);
      const w = Math.abs(zoneDrawCurrent.x - zoneDrawStart.x);
      const h = Math.abs(zoneDrawCurrent.y - zoneDrawStart.y);
      if (w > 10 && h > 10) {
        setPendingZone({ x, y, width: w, height: h, label: "", color: ZONE_COLORS[zoneColorIdx] });
        setZoneLabel("");
        setShowZoneDialog(true);
      }
      setZoneDrawStart(null);
      setZoneDrawCurrent(null);
    }
  };

  const handleMarkerMouseDown = (e: React.MouseEvent, markerId: string) => {
    if (isReadOnly || drawMode !== "select") return;
    e.stopPropagation();
    const pos = svgToMap(e.clientX, e.clientY);
    const mk = activeMap?.markers.find(m => m.id === markerId);
    if (!mk) return;
    setDraggingMarkerId(markerId);
    setMarkerDragOffset({ dx: pos.x - mk.x, dy: pos.y - mk.y });
    setSelectedMarkerId(markerId);
    setSelectedZoneId(null);
  };

  const saveMarker = () => {
    if (!editMarker || !activeMap) return;
    if (!editMarker.label?.trim()) {
      toast({ title: "Erreur", description: "Le nom du marqueur est requis.", variant: "destructive" });
      return;
    }
    if (editMarker.id) {
      updateActiveMap(m => ({
        ...m,
        markers: m.markers.map(mk => mk.id === editMarker.id ? { ...mk, ...editMarker } as SiteMarker : mk),
      }));
    } else {
      const newMarker: SiteMarker = {
        id: genId(),
        x: pendingMarkerPos?.x ?? editMarker.x ?? 100,
        y: pendingMarkerPos?.y ?? editMarker.y ?? 100,
        label: editMarker.label!,
        status: (editMarker.status as MarkerStatus) ?? "unknown",
        assetId: editMarker.assetId,
        assetName: editMarker.assetName,
        note: editMarker.note,
      };
      updateActiveMap(m => ({ ...m, markers: [...m.markers, newMarker] }));
    }
    setShowMarkerDialog(false);
    setEditMarker(null);
    setPendingMarkerPos(null);
    toast({ title: "Marqueur sauvegardé" });
  };

  const discardMarker = () => {
    setShowMarkerDialog(false);
    setEditMarker(null);
    setPendingMarkerPos(null);
  };

  const deleteMarker = (id: string) => {
    updateActiveMap(m => ({ ...m, markers: m.markers.filter(mk => mk.id !== id) }));
    setSelectedMarkerId(null);
    setShowMarkerDialog(false);
  };

  const saveZone = () => {
    if (!pendingZone) return;
    const newZone: SiteZone = {
      id: genId(),
      ...pendingZone,
      label: zoneLabel.trim() || "Zone",
      color: ZONE_COLORS[zoneColorIdx],
    };
    updateActiveMap(m => ({ ...m, zones: [...m.zones, newZone] }));
    setShowZoneDialog(false);
    setPendingZone(null);
    setZoneDrawStart(null);
    setZoneDrawCurrent(null);
    toast({ title: "Zone ajoutée" });
  };

  const deleteZone = (id: string) => {
    updateActiveMap(m => ({ ...m, zones: m.zones.filter(z => z.id !== id) }));
    setSelectedZoneId(null);
  };

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const CANVAS_W = 1200;
  const CANVAS_H = 800;

  const selectedMarker = activeMap?.markers.find(m => m.id === selectedMarkerId);
  const canvasWidth = 1200;
  const canvasHeight = 800;

  return (
    <div className="space-y-0 h-full flex flex-col -m-8">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-8 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm shrink-0">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-0.5">Cartographie</p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Plans de site</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <Button size="sm" onClick={() => setShowNewMapDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau plan
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: map list */}
        <aside className="w-64 border-r border-border/50 bg-card/40 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-3 border-b border-border/40">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Plans ({maps.length})</p>
          </div>
          {maps.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6 text-center">
              <Map className="h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
              <p className="text-sm text-muted-foreground">Aucun plan. Créez votre premier plan de site.</p>
              {!isReadOnly && (
                <Button size="sm" variant="outline" onClick={() => setShowNewMapDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />Nouveau plan
                </Button>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {maps.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setActiveMapId(m.id); setZoom(1); setPan({ x: 0, y: 0 }); setSelectedMarkerId(null); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors group ${
                    m.id === activeMapId ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {m.backgroundImage
                        ? <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        : <Building2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      }
                      <span className="font-medium truncate">{m.name}</span>
                    </div>
                    {!isReadOnly && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMap(m.id); }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs opacity-60">
                    <span className="flex items-center gap-1"><Pin className="h-3 w-3" />{m.markers.length}</span>
                    <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{m.zones.length}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Main canvas area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {!activeMap ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <Map className="h-16 w-16 text-muted-foreground/20" strokeWidth={1} />
              <p className="text-lg font-semibold text-foreground">Sélectionnez ou créez un plan</p>
              <p className="text-sm text-muted-foreground max-w-md">Importez un fond de plan (image PNG/JPG), tracez des zones et positionnez vos équipements sur une carte 2D interactive.</p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div data-toolbar="true" className="flex items-center gap-2 px-4 py-2 border-b border-border/40 bg-card/30 shrink-0 flex-wrap">
                <div className="flex items-center gap-1 bg-background/60 rounded-xl border border-border/60 p-1">
                  {([
                    { mode: "select" as DrawMode, icon: Move, label: "Sélectionner / Déplacer" },
                    { mode: "pin" as DrawMode, icon: Pin, label: "Ajouter un équipement" },
                    { mode: "zone" as DrawMode, icon: Layers, label: "Tracer une zone" },
                    { mode: "pan" as DrawMode, icon: Maximize2, label: "Naviguer (panoramique)" },
                  ] as { mode: DrawMode; icon: any; label: string }[]).map(({ mode, icon: Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setDrawMode(mode)}
                      title={label}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                        drawMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  ))}
                </div>

                <div className="h-5 w-px bg-border/60" />

                <div className="flex items-center gap-1">
                  <button onClick={() => setZoom(z => Math.min(4, z + 0.2))} className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                    <ZoomIn className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <span className="text-xs text-muted-foreground w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                    <ZoomOut className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button onClick={resetView} className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors" title="Réinitialiser la vue">
                    <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="h-5 w-px bg-border/60" />

                {!isReadOnly && (
                  <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" />
                    {activeMap.backgroundImage ? "Changer l'image" : "Importer image"}
                  </Button>
                )}
                {!isReadOnly && activeMap.backgroundImage && (
                  <Button size="sm" variant="ghost" className="gap-1.5 h-8 text-muted-foreground" onClick={() => updateActiveMap(m => ({ ...m, backgroundImage: undefined }))}>
                    <X className="h-3.5 w-3.5" />
                    Supprimer fond
                  </Button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => setShowZones(v => !v)} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${showZones ? "bg-primary/10 text-primary border-primary/30" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
                    <Layers className="h-3.5 w-3.5" />{showZones ? "Zones" : "Zones (masqué)"}
                  </button>
                  <button onClick={() => setShowMarkers(v => !v)} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${showMarkers ? "bg-primary/10 text-primary border-primary/30" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
                    <Pin className="h-3.5 w-3.5" />{showMarkers ? "Équipements" : "Équipements (masqué)"}
                  </button>
                </div>
              </div>

              {/* Canvas */}
              <div className="flex-1 overflow-hidden relative bg-[#0A0F1A]"
                style={{ cursor: drawMode === "pan" || isPanning ? "grab" : drawMode === "pin" ? "crosshair" : drawMode === "zone" ? "crosshair" : "default" }}
              >
                {/* Grid background */}
                <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
                  <defs>
                    <pattern id="grid-sm" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" />
                    </pattern>
                    <pattern id="grid-lg" width="100" height="100" patternUnits="userSpaceOnUse">
                      <rect width="100" height="100" fill="url(#grid-sm)" />
                      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#475569" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-lg)" />
                </svg>

                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  style={{ position: "absolute", inset: 0, userSelect: "none" }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                  onWheel={(e) => {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    setZoom(z => Math.max(0.2, Math.min(4, z + delta)));
                  }}
                >
                  <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                    {/* Background image */}
                    {activeMap.backgroundImage && (
                      <image
                        href={activeMap.backgroundImage}
                        x="0" y="0"
                        width={canvasWidth}
                        height={canvasHeight}
                        preserveAspectRatio="xMidYMid meet"
                        style={{ opacity: 0.85 }}
                      />
                    )}

                    {/* Zones */}
                    {showZones && activeMap.zones.map(zone => (
                      <g
                        key={zone.id}
                        data-zone="true"
                        onClick={() => { if (drawMode === "select") { setSelectedZoneId(zone.id); setSelectedMarkerId(null); } }}
                        style={{ cursor: drawMode === "select" ? "pointer" : "default" }}
                      >
                        <rect
                          x={zone.x} y={zone.y}
                          width={zone.width} height={zone.height}
                          fill={zone.color}
                          stroke={selectedZoneId === zone.id ? "#0A6DFF" : zone.color.replace("40", "80")}
                          strokeWidth={selectedZoneId === zone.id ? 2 / zoom : 1 / zoom}
                          rx={4 / zoom}
                        />
                        <text
                          x={zone.x + zone.width / 2}
                          y={zone.y + 16 / zoom}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.7)"
                          fontSize={11 / zoom}
                          fontWeight="600"
                          fontFamily="system-ui"
                          pointerEvents="none"
                        >
                          {zone.label}
                        </text>
                      </g>
                    ))}

                    {/* Zone draw preview */}
                    {drawMode === "zone" && zoneDrawStart && zoneDrawCurrent && (
                      <rect
                        x={Math.min(zoneDrawStart.x, zoneDrawCurrent.x)}
                        y={Math.min(zoneDrawStart.y, zoneDrawCurrent.y)}
                        width={Math.abs(zoneDrawCurrent.x - zoneDrawStart.x)}
                        height={Math.abs(zoneDrawCurrent.y - zoneDrawStart.y)}
                        fill={ZONE_COLORS[zoneColorIdx]}
                        stroke="#0A6DFF"
                        strokeWidth={2 / zoom}
                        strokeDasharray={`${6 / zoom} ${3 / zoom}`}
                        rx={4 / zoom}
                      />
                    )}

                    {/* Markers */}
                    {showMarkers && activeMap.markers.map(marker => {
                      const meta = STATUS_META[marker.status];
                      const isSelected = selectedMarkerId === marker.id;
                      const r = 14 / zoom;
                      return (
                        <g
                          key={marker.id}
                          data-marker="true"
                          transform={`translate(${marker.x},${marker.y})`}
                          onMouseDown={(e) => handleMarkerMouseDown(e, marker.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (drawMode === "select") {
                              setSelectedMarkerId(marker.id);
                              setSelectedZoneId(null);
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (!isReadOnly) {
                              setEditMarker({ ...marker });
                              setShowMarkerDialog(true);
                            }
                          }}
                          style={{ cursor: drawMode === "select" ? (draggingMarkerId === marker.id ? "grabbing" : "grab") : "default" }}
                        >
                          {/* Pulse ring for breakdown */}
                          {marker.status === "breakdown" && (
                            <circle cx="0" cy="0" r={r * 1.8} fill="none" stroke="#EF4444" strokeWidth={1.5 / zoom} opacity={0.4} />
                          )}
                          {/* Selection ring */}
                          {isSelected && (
                            <circle cx="0" cy="0" r={r + 6 / zoom} fill="none" stroke="#0A6DFF" strokeWidth={2 / zoom} strokeDasharray={`${5 / zoom} ${3 / zoom}`} />
                          )}
                          {/* Main circle */}
                          <circle cx="0" cy="0" r={r} fill={meta.color} opacity={0.95} />
                          <circle cx="0" cy="0" r={r} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5 / zoom} />
                          {/* Icon (simple wrench shape via path) */}
                          <text x="0" y={5 / zoom} textAnchor="middle" fill="white" fontSize={11 / zoom} fontWeight="bold" fontFamily="system-ui" pointerEvents="none">
                            {marker.status === "operational" ? "✓" : marker.status === "breakdown" ? "!" : marker.status === "maintenance" ? "⚙" : "?"}
                          </text>
                          {/* Label */}
                          <text
                            x="0"
                            y={r + 12 / zoom}
                            textAnchor="middle"
                            fill="white"
                            fontSize={9 / zoom}
                            fontWeight="600"
                            fontFamily="system-ui"
                            pointerEvents="none"
                            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                          >
                            {marker.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Hint bar */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-border/60 rounded-full px-4 py-2 text-xs text-muted-foreground pointer-events-none">
                  {drawMode === "select" && "Cliquez pour sélectionner · Double-clic pour éditer · Glisser pour déplacer"}
                  {drawMode === "pin" && "Cliquez sur la carte pour placer un équipement"}
                  {drawMode === "zone" && "Cliquez et glissez pour tracer une zone"}
                  {drawMode === "pan" && "Cliquez et glissez pour naviguer · Molette pour zoomer"}
                </div>

                {/* Legend */}
                <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm border border-border/60 rounded-xl p-3 space-y-1.5">
                  {Object.entries(STATUS_META).map(([k, meta]) => (
                    <div key={k} className="flex items-center gap-2 text-xs">
                      <div className="h-3 w-3 rounded-full" style={{ background: meta.color }} />
                      <span className="text-muted-foreground">{meta.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: selected item panel */}
        <AnimatePresence>
          {activeMap && (selectedMarkerId || selectedZoneId) && (
            <motion.aside
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-72 border-l border-border/50 bg-card/60 backdrop-blur-sm flex flex-col overflow-y-auto shrink-0"
            >
              {selectedMarker && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Équipement</h3>
                    <button onClick={() => setSelectedMarkerId(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: STATUS_META[selectedMarker.status].bg }}>
                      <div className="h-3 w-3 rounded-full" style={{ background: STATUS_META[selectedMarker.status].color }} />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{selectedMarker.label}</div>
                      <div className="text-xs font-medium mt-0.5" style={{ color: STATUS_META[selectedMarker.status].color }}>
                        {STATUS_META[selectedMarker.status].label}
                      </div>
                    </div>
                  </div>
                  {selectedMarker.assetName && (
                    <div className="text-xs text-muted-foreground bg-background/50 rounded-xl p-3">
                      <span className="font-medium text-foreground">Lié à: </span>{selectedMarker.assetName}
                    </div>
                  )}
                  {selectedMarker.note && (
                    <div className="text-xs text-muted-foreground bg-background/50 rounded-xl p-3 italic">"{selectedMarker.note}"</div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Position: ({Math.round(selectedMarker.x)}, {Math.round(selectedMarker.y)})
                  </div>
                  {!isReadOnly && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => {
                        setEditMarker({ ...selectedMarker });
                        setShowMarkerDialog(true);
                      }}>
                        <Pencil className="h-3.5 w-3.5" />Éditer
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive gap-2" onClick={() => deleteMarker(selectedMarker.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {selectedZoneId && !selectedMarkerId && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Zone</h3>
                    <button onClick={() => setSelectedZoneId(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {(() => {
                    const zone = activeMap.zones.find(z => z.id === selectedZoneId);
                    if (!zone) return null;
                    return (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg border-2" style={{ background: zone.color, borderColor: zone.color.replace("40", "80") }} />
                          <span className="font-semibold text-foreground">{zone.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Position: ({Math.round(zone.x)}, {Math.round(zone.y)})</div>
                          <div>Taille: {Math.round(zone.width)} × {Math.round(zone.height)}</div>
                        </div>
                        {!isReadOnly && (
                          <Button size="sm" variant="outline" className="w-full text-destructive hover:text-destructive gap-2" onClick={() => deleteZone(zone.id)}>
                            <Trash2 className="h-3.5 w-3.5" />Supprimer la zone
                          </Button>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Marker dialog */}
      <Dialog open={showMarkerDialog} onOpenChange={(o) => { if (!o) discardMarker(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editMarker?.id ? "Modifier l'équipement" : "Ajouter un équipement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Nom *</label>
              <Input
                value={editMarker?.label ?? ""}
                onChange={e => setEditMarker(prev => ({ ...prev, label: e.target.value }))}
                placeholder="ex: Pompe P-101"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">État</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(STATUS_META) as [MarkerStatus, typeof STATUS_META[MarkerStatus]][]).map(([k, meta]) => (
                  <button
                    key={k}
                    onClick={() => setEditMarker(prev => ({ ...prev, status: k }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                      editMarker?.status === k ? "border-2" : "border opacity-60 hover:opacity-100"
                    }`}
                    style={{
                      borderColor: editMarker?.status === k ? meta.color : undefined,
                      background: editMarker?.status === k ? meta.bg : undefined,
                      color: editMarker?.status === k ? meta.color : undefined,
                    }}
                  >
                    <div className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Lier à un équipement</label>
              <select
                value={editMarker?.assetId ?? ""}
                onChange={e => {
                  const asset = (assets || []).find(a => a.id === Number(e.target.value));
                  setEditMarker(prev => ({ ...prev, assetId: asset?.id, assetName: asset?.name }));
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">— Aucun —</option>
                {(assets || []).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Note</label>
              <Input
                value={editMarker?.note ?? ""}
                onChange={e => setEditMarker(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Observations, numéro de série…"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editMarker?.id && !isReadOnly && (
              <Button variant="outline" className="text-destructive hover:text-destructive mr-auto gap-1.5" onClick={() => deleteMarker(editMarker.id!)}>
                <Trash2 className="h-4 w-4" />Supprimer
              </Button>
            )}
            <Button variant="ghost" onClick={discardMarker}>Annuler</Button>
            <Button onClick={saveMarker}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zone dialog */}
      <Dialog open={showZoneDialog} onOpenChange={(o) => { if (!o) { setShowZoneDialog(false); setPendingZone(null); setZoneDrawStart(null); setZoneDrawCurrent(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nommer la zone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              value={zoneLabel}
              onChange={e => setZoneLabel(e.target.value)}
              placeholder="ex: Atelier A, Zone Électrique…"
              autoFocus
              onKeyDown={e => e.key === "Enter" && saveZone()}
            />
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Couleur</label>
              <div className="flex gap-2">
                {ZONE_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setZoneColorIdx(i)}
                    className={`h-7 w-7 rounded-lg border-2 transition-transform ${zoneColorIdx === i ? "scale-110 border-white" : "border-transparent"}`}
                    style={{ background: c.replace("40", "cc") }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowZoneDialog(false); setPendingZone(null); setZoneDrawStart(null); setZoneDrawCurrent(null); }}>Annuler</Button>
            <Button onClick={saveZone}>Créer la zone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New map dialog */}
      <Dialog open={showNewMapDialog} onOpenChange={setShowNewMapDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouveau plan de site</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={newMapName}
              onChange={e => setNewMapName(e.target.value)}
              placeholder="Nom du plan (ex: Usine Nord, Bâtiment A)"
              autoFocus
              onKeyDown={e => e.key === "Enter" && createMap()}
            />
            <Input
              value={newMapDesc}
              onChange={e => setNewMapDesc(e.target.value)}
              placeholder="Description (optionnel)"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewMapDialog(false)}>Annuler</Button>
            <Button onClick={createMap} disabled={!newMapName.trim()}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, QrCode } from "lucide-react";

interface Props {
  asset: { id: number; name: string; serialNumber?: string; category?: string } | null;
  open: boolean;
  onClose: () => void;
}

export function QRCodeDialog({ asset, open, onClose }: Props) {
  const qrRef = useRef<HTMLDivElement>(null);

  if (!asset) return null;

  const qrUrl = `${window.location.origin}/assets?qr=${asset.id}`;

  const handlePrint = () => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>QR – ${asset.name}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; font-family: -apple-system, system-ui, sans-serif; }
        .card { text-align: center; padding: 28px 32px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 320px; }
        .logo { font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: #64748b; margin-bottom: 14px; }
        .name { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .serial { font-size: 11px; color: #64748b; font-family: monospace; margin-bottom: 16px; }
        .qr-box { display: inline-block; background: #fff; padding: 8px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 14px; }
        .url { font-size: 8px; color: #94a3b8; word-break: break-all; margin-top: 10px; }
        .cat { font-size: 10px; color: #94a3b8; margin-top: 4px; }
      </style>
    </head><body>
      <div class="card">
        <div class="logo">SWAN GMAO</div>
        <div class="name">${asset.name}</div>
        ${asset.serialNumber ? `<div class="serial">${asset.serialNumber}</div>` : ""}
        ${asset.category ? `<div class="cat">${asset.category}</div>` : ""}
        <div class="qr-box">${svgData}</div>
        <div class="url">${qrUrl}</div>
      </div>
      <script>window.onload=function(){window.print();window.close();}<\/script>
    </body></html>`);
    win.document.close();
  };

  const handleDownload = () => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;

    const canvas = document.createElement("canvas");
    const padding = 24;
    const qrSize = 220;
    const textHeight = 60;
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding * 2 + textHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, qrSize, qrSize);

      const cy = qrSize + padding + 24;
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 14px -apple-system, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(asset.name, canvas.width / 2, cy);

      if (asset.serialNumber) {
        ctx.fillStyle = "#64748b";
        ctx.font = "11px monospace";
        ctx.fillText(asset.serialNumber, canvas.width / 2, cy + 18);
      }

      ctx.fillStyle = "#94a3b8";
      ctx.font = "9px -apple-system, system-ui, sans-serif";
      const maxUrlWidth = canvas.width - 16;
      let url = qrUrl;
      while (ctx.measureText(url).width > maxUrlWidth && url.length > 20) {
        url = url.slice(0, -1);
      }
      if (url.length < qrUrl.length) url += "…";
      ctx.fillText(url, canvas.width / 2, cy + 40);

      const link = document.createElement("a");
      link.download = `qr-${asset.name.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Code QR équipement
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 pt-1">
          <div ref={qrRef} className="bg-white p-4 rounded-2xl border border-border/40 shadow-sm">
            <QRCodeSVG
              value={qrUrl}
              size={210}
              bgColor="#ffffff"
              fgColor="#0A0A0A"
              level="M"
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{asset.name}</p>
            {asset.serialNumber && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{asset.serialNumber}</p>
            )}
            {asset.category && (
              <p className="text-xs text-muted-foreground/60 mt-0.5">{asset.category}</p>
            )}
            <p className="text-xs text-muted-foreground/40 mt-2 max-w-[220px] truncate text-center">{qrUrl}</p>
          </div>

          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" strokeWidth={1.5} />
              Imprimer
            </Button>
            <Button className="flex-1 gap-2" onClick={handleDownload}>
              <Download className="h-4 w-4" strokeWidth={1.5} />
              Télécharger
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

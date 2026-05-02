import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/utils";
import { Loader2, Network, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { Card } from "@workspace/api-client-react/src/generated/api.schemas";

interface MindMapNode {
  center: string;
  branches: Array<{
    label: string;
    color: string;
    children: string[];
  }>;
}

/* ─────────────────────────────────────────────────────────────────
   Layout constants (content coordinate space, centred at 0,0)
───────────────────────────────────────────────────────────────── */
const BRANCH_RADIUS = 190;
const CHILD_RADIUS  = 360;
const NODE_R        = 44;
const CENTER_R      = 64;
const CHILD_W       = 108;
const CHILD_H       = 34;
const CHILD_RX      = 9;

/* SVG viewBox (screen-space container) */
const VW = 900;
const VH = 660;
const CX = VW / 2; // 450
const CY = VH / 2; // 330

function splitText(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur ? cur + " " + w : w).length > max && cur) { lines.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ─────────────────────────────────────────────────────────────────
   High-res SVG (static, no transforms — zoom handled by parent)
───────────────────────────────────────────────────────────────── */
function MindMapContent({ data }: { data: MindMapNode }) {
  const branches = data.branches;
  const n = branches.length;

  return (
    <>
      {/* Subtle radial bg glow at center */}
      <circle cx={0} cy={0} r={CENTER_R + 30} fill="hsl(var(--primary))" fillOpacity="0.04" />

      {branches.map((branch, bi) => {
        const angleBase = (bi / n) * 2 * Math.PI - Math.PI / 2;
        const bx = BRANCH_RADIUS * Math.cos(angleBase);
        const by = BRANCH_RADIUS * Math.sin(angleBase);
        const nc = branch.children.length;

        return (
          <g key={bi}>
            {/* Arm from center → branch */}
            <line
              x1={0} y1={0} x2={bx} y2={by}
              stroke={branch.color} strokeWidth="2.8" strokeOpacity="0.55"
              strokeLinecap="round"
            />

            {/* Branch children */}
            {branch.children.map((child, ci) => {
              const spread = Math.PI / 2.6;
              const childAngle = angleBase + spread * (ci / Math.max(nc - 1, 1) - 0.5);
              const chx = CHILD_RADIUS * Math.cos(childAngle);
              const chy = CHILD_RADIUS * Math.sin(childAngle);
              const lines = splitText(child, 16);

              return (
                <g key={ci}>
                  <line
                    x1={bx} y1={by} x2={chx} y2={chy}
                    stroke={branch.color} strokeWidth="1.5"
                    strokeOpacity="0.35" strokeDasharray="4,4"
                    strokeLinecap="round"
                  />
                  {/* Child pill */}
                  <rect
                    x={chx - CHILD_W / 2} y={chy - CHILD_H / 2}
                    width={CHILD_W} height={CHILD_H}
                    rx={CHILD_RX}
                    fill={branch.color} fillOpacity="0.1"
                    stroke={branch.color} strokeWidth="1.2" strokeOpacity="0.35"
                  />
                  <text
                    x={chx} y={chy}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="9.5" fill="currentColor" fillOpacity="0.88"
                    fontFamily="inherit"
                  >
                    {lines.map((line, li) => (
                      <tspan
                        key={li} x={chx}
                        dy={li === 0 ? `${-(lines.length - 1) * 0.6}em` : "1.25em"}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}

            {/* Branch node circle */}
            <circle
              cx={bx} cy={by} r={NODE_R}
              fill={branch.color} fillOpacity="0.14"
              stroke={branch.color} strokeWidth="2"
            />
            {/* Inner glow */}
            <circle cx={bx} cy={by} r={NODE_R - 8} fill={branch.color} fillOpacity="0.06" />
            <text
              x={bx} y={by}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="11" fontWeight="700" fill={branch.color}
              fontFamily="inherit"
            >
              {splitText(branch.label, 10).map((line, li, arr) => (
                <tspan key={li} x={bx} dy={li === 0 ? `${-(arr.length - 1) * 0.6}em` : "1.3em"}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}

      {/* Center node (rendered last → always on top) */}
      <circle cx={0} cy={0} r={CENTER_R} fill="hsl(var(--primary))" fillOpacity="0.14" stroke="hsl(var(--primary))" strokeWidth="2.5" />
      <circle cx={0} cy={0} r={CENTER_R - 10} fill="hsl(var(--primary))" fillOpacity="0.07" />
      <text
        x={0} y={0}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="13" fontWeight="800" fill="hsl(var(--primary))"
        fontFamily="inherit"
      >
        {splitText(data.center, 12).map((line, i, arr) => (
          <tspan key={i} x={0} dy={i === 0 ? `${-(arr.length - 1) * 0.65}em` : "1.3em"}>
            {line}
          </tspan>
        ))}
      </text>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Zoomable / pannable viewer
───────────────────────────────────────────────────────────────── */
function MindMapViewer({ data }: { data: MindMapNode }) {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const zoomRef = useRef(1);
  const panRef  = useRef({ x: 0, y: 0 });
  const drag    = useRef({ active: false, lastX: 0, lastY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  /* Keep refs in sync with state (for use inside event handlers) */
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = { x: panX, y: panY }; }, [panX, panY]);

  /* Wheel → zoom toward cursor */
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const mouseVX = (e.clientX - rect.left)  * (VW / rect.width);
    const mouseVY = (e.clientY - rect.top)   * (VH / rect.height);

    const factor = e.deltaY < 0 ? 1.14 : 1 / 1.14;

    const prevZoom = zoomRef.current;
    const prevPan  = panRef.current;
    const newZoom  = Math.max(0.2, Math.min(8, prevZoom * factor));

    /* cursor world pos stays fixed */
    const wx = (mouseVX - CX - prevPan.x) / prevZoom;
    const wy = (mouseVY - CY - prevPan.y) / prevZoom;
    const newPanX = mouseVX - CX - wx * newZoom;
    const newPanY = mouseVY - CY - wy * newZoom;

    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  /* Drag → pan */
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { active: true, lastX: e.clientX, lastY: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.lastX;
    const dy = e.clientY - drag.current.lastY;
    drag.current.lastX = e.clientX;
    drag.current.lastY = e.clientY;
    setPanX(p => p + dx * (VW / containerRef.current!.getBoundingClientRect().width));
    setPanY(p => p + dy * (VH / containerRef.current!.getBoundingClientRect().height));
  };
  const onPointerUp = () => { drag.current.active = false; };

  const zoomIn   = () => { const z = Math.min(zoomRef.current * 1.25, 8);  setZoom(z); };
  const zoomOut  = () => { const z = Math.max(zoomRef.current / 1.25, 0.2); setZoom(z); };
  const resetView = () => { setZoom(1); setPanX(0); setPanY(0); };

  /* The <g> inside the SVG: translate to viewBox centre + pan, then scale */
  const transform = `translate(${CX + panX} ${CY + panY}) scale(${zoom})`;

  return (
    <div className="relative rounded-xl border border-border/40 bg-muted/20 overflow-hidden select-none" style={{ height: 460 }}>

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={zoomIn}
          className="h-7 w-7 flex items-center justify-center rounded-md bg-background/90 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={zoomOut}
          className="h-7 w-7 flex items-center justify-center rounded-md bg-background/90 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={resetView}
          className="h-7 w-7 flex items-center justify-center rounded-md bg-background/90 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
          title="Reset view"
        >
          <Maximize2 className="h-3 w-3" />
        </button>
      </div>

      {/* Zoom level badge */}
      <div className="absolute bottom-3 left-3 z-10 px-2 py-0.5 rounded-md bg-background/80 border border-border/40 text-[10px] text-muted-foreground font-mono">
        {Math.round(zoom * 100)}%
      </div>

      {/* Hint */}
      <div className="absolute bottom-3 right-3 z-10 text-[10px] text-muted-foreground/50 pointer-events-none">
        scroll to zoom · drag to pan
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ cursor: drag.current.active ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ display: "block" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform={transform}>
            <MindMapContent data={data} />
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Panel shell
───────────────────────────────────────────────────────────────── */
export function MindMapPanel({
  deckName,
  cards,
  onClose,
}: {
  deckName: string;
  cards: Card[];
  onClose: () => void;
}) {
  const [mapData, setMapData] = useState<MindMapNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sample = cards.slice(0, 30).map(c => ({ front: c.front, back: c.back }));
      const resp = await fetch(apiUrl("api/mind-map"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: deckName, cards: sample }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to generate mind map.");
      }
      const data = await resp.json() as MindMapNode;
      setMapData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate mind map.");
    } finally {
      setLoading(false);
    }
  }, [deckName, cards]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-background rounded-2xl shadow-2xl border border-border/60 flex flex-col overflow-hidden"
        style={{ maxHeight: "92vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Network className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">AI Mind Map</p>
              <p className="text-[11px] text-muted-foreground">{deckName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          {!mapData && !loading && !error && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Network className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-foreground">Generate a mind map</p>
                <p className="text-sm text-muted-foreground">
                  AI will map the key concepts from this deck into a visual network.
                </p>
              </div>
              <Button onClick={generate} className="gap-2 mt-2">
                <Network className="h-4 w-4" /> Generate Mind Map
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Building your mind map…</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={generate}>Try again</Button>
            </div>
          )}

          {mapData && !loading && (
            <div className="space-y-4">
              <MindMapViewer data={mapData} />

              {/* Branch legend */}
              <div className="grid grid-cols-2 gap-2">
                {mapData.branches.map((b, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-3 border"
                    style={{ borderColor: b.color + "33", backgroundColor: b.color + "0d" }}
                  >
                    <p className="text-xs font-semibold mb-1.5" style={{ color: b.color }}>{b.label}</p>
                    <ul className="space-y-0.5">
                      {b.children.map((c, ci) => (
                        <li key={ci} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                          <span
                            className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: b.color + "99" }}
                          />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" className="w-full gap-2" onClick={generate}>
                <Network className="h-3.5 w-3.5" /> Regenerate
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

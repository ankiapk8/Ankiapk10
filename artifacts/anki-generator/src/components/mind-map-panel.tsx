import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/utils";
import { Loader2, Network, X } from "lucide-react";
import type { Card } from "@workspace/api-client-react/src/generated/api.schemas";

interface MindMapNode {
  center: string;
  branches: Array<{
    label: string;
    color: string;
    children: string[];
  }>;
}

function MindMapSvg({ data }: { data: MindMapNode }) {
  const cx = 300;
  const cy = 220;
  const branchRadius = 130;
  const childRadius = 220;
  const branches = data.branches;
  const n = branches.length;

  return (
    <svg
      viewBox="0 0 600 440"
      className="w-full h-auto"
      style={{ maxHeight: 420 }}
    >
      {branches.map((branch, bi) => {
        const angleBase = (bi / n) * 2 * Math.PI - Math.PI / 2;
        const bx = cx + branchRadius * Math.cos(angleBase);
        const by = cy + branchRadius * Math.sin(angleBase);
        const nc = branch.children.length;

        return (
          <g key={bi}>
            <line
              x1={cx} y1={cy} x2={bx} y2={by}
              stroke={branch.color} strokeWidth="2.5" strokeOpacity="0.7"
            />
            <circle cx={bx} cy={by} r="28" fill={branch.color} fillOpacity="0.15" stroke={branch.color} strokeWidth="1.5" />
            <text x={bx} y={by} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fontWeight="600" fill={branch.color}>
              {splitText(branch.label, 12).map((line, i, arr) => (
                <tspan key={i} x={bx} dy={i === 0 ? `${-(arr.length - 1) * 0.6}em` : "1.2em"}>{line}</tspan>
              ))}
            </text>

            {branch.children.map((child, ci) => {
              const spread = Math.PI / 3;
              const childAngle = angleBase + spread * (ci / Math.max(nc - 1, 1) - 0.5);
              const chx = cx + childRadius * Math.cos(childAngle);
              const chy = cy + childRadius * Math.sin(childAngle);

              return (
                <g key={ci}>
                  <line
                    x1={bx} y1={by} x2={chx} y2={chy}
                    stroke={branch.color} strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="3,3"
                  />
                  <rect
                    x={chx - 38} y={chy - 14}
                    width="76" height="28"
                    rx="6"
                    fill={branch.color} fillOpacity="0.08"
                    stroke={branch.color} strokeWidth="1" strokeOpacity="0.3"
                  />
                  <text x={chx} y={chy} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="currentColor" fillOpacity="0.85">
                    {splitText(child, 14).map((line, li, arr) => (
                      <tspan key={li} x={chx} dy={li === 0 ? `${-(arr.length - 1) * 0.55}em` : "1.1em"}>{line}</tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r="44" fill="hsl(var(--primary))" fillOpacity="0.12" stroke="hsl(var(--primary))" strokeWidth="2" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fontWeight="700" fill="hsl(var(--primary))">
        {splitText(data.center, 14).map((line, i, arr) => (
          <tspan key={i} x={cx} dy={i === 0 ? `${-(arr.length - 1) * 0.6}em` : "1.2em"}>{line}</tspan>
        ))}
      </text>
    </svg>
  );
}

function splitText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-background rounded-2xl shadow-2xl border border-border/60 flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Network className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">AI Mind Map</p>
              <p className="text-[11px] text-muted-foreground">{deckName}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!mapData && !loading && !error && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Network className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-foreground">Generate a mind map</p>
                <p className="text-sm text-muted-foreground">AI will map the key concepts from this deck into a visual network.</p>
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
              <div className="rounded-xl border border-border/40 bg-muted/20 p-2">
                <MindMapSvg data={mapData} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {mapData.branches.map((b, i) => (
                  <div key={i} className="rounded-lg p-3 border" style={{ borderColor: b.color + "33", backgroundColor: b.color + "0d" }}>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: b.color }}>{b.label}</p>
                    <ul className="space-y-0.5">
                      {b.children.map((c, ci) => (
                        <li key={ci} className="text-[11px] text-muted-foreground flex items-start gap-1">
                          <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: b.color + "88" }} />
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

"use client";

import { useMemo, useRef, useState } from "react";

export interface Zona { id: string; piso: string; sector: string; nombre: string; x: number; y: number; ancho: number; alto: number }
export interface LocalPlano { id: string; nombre: string; piso: string; sector: string; numero_local: string; coord_x: number; coord_y: number; categoria: string; zona_id: string | null; activo: boolean }
export interface Plano { pisos: { id: string; nombre: string }[]; ancho: number; alto: number; zonas: Zona[]; locales: LocalPlano[] }

/** Incluye los niveles de todos los registros, incluso si un servidor antiguo omitió un piso. */
export function nivelesPlano(plano: Plano) {
  const niveles = new Map((plano.pisos??[]).map(p=>[p.id,p]));
  for (const fila of [...plano.zonas,...plano.locales]) if (!niveles.has(fila.piso)) niveles.set(fila.piso,{id:fila.piso,nombre:fila.piso==='T'?'Planta baja':fila.piso.replace(/^N/,'Nivel ')});
  return [...niveles.values()].sort((a,b)=>a.id==='T'?-1:b.id==='T'?1:a.id.localeCompare(b.id,'es',{numeric:true}));
}

/** Escala de calor del documento: grafito (bajo) → ámbar (alto). */
export function colorCalor(t: number): string {
  const c = Math.max(0, Math.min(1, t));
  const a = [90, 90, 90];
  const b = [173, 131, 30];
  const d = [244, 180, 26];
  const mezcla = (x: number[], y: number[], k: number) => x.map((v, i) => Math.round(v + (y[i] - v) * k));
  const [r, g, bl] = c < 0.55 ? mezcla(a, b, c / 0.55) : mezcla(b, d, (c - 0.55) / 0.45);
  return `rgb(${r},${g},${bl})`;
}

// ------------------------------------------------------------------ vista 2D por piso
export function Plano2D({
  plano, piso, valorZona, valorLocal, maxZona = 1, maxLocal = 1, seleccionado, onLocal, onPunto, oscuro = false, alto,
}: {
  plano: Plano; piso: string; valorZona?: Map<string, number>; valorLocal?: Map<string, number>; maxZona?: number; maxLocal?: number;
  seleccionado?: string | null; onLocal?: (l: LocalPlano) => void; onPunto?: (x: number, y: number) => void; oscuro?: boolean; alto?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const zonas = plano.zonas.filter((z) => z.piso === piso);
  const locales = plano.locales.filter((l) => l.piso === piso);
  const tinta = oscuro ? "#ffffff" : "#16140f";
  const linea = oscuro ? "#525252" : "#cbc2b2";

  function clic(e: React.MouseEvent<SVGSVGElement>) {
    if (!onPunto || !ref.current) return;
    const p = ref.current.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const r = p.matrixTransform(ref.current.getScreenCTM()!.inverse());
    onPunto(Math.round(Math.max(0, Math.min(plano.ancho, r.x))), Math.round(Math.max(0, Math.min(plano.alto, r.y))));
  }

  return (
    <svg ref={ref} viewBox={`-10 -10 ${plano.ancho + 20} ${plano.alto + 20}`} style={{ width: "100%", height: alto ?? "auto", cursor: onPunto ? "crosshair" : undefined }} onClick={clic} role={onLocal || onPunto ? "group" : "img"} aria-label={`Plano del piso ${piso}`}>
      <rect x={0} y={0} width={plano.ancho} height={plano.alto} fill={oscuro ? "#1a1a1a" : "#fff"} stroke={linea} />

      {zonas.map((z) => {
        const v = valorZona?.get(z.id);
        return (
          <g key={z.id}>
            <rect x={z.x} y={z.y} width={z.ancho} height={z.alto} fill={v !== undefined ? colorCalor(v / maxZona) : "transparent"} fillOpacity={v !== undefined ? 0.32 : 0} stroke={linea} strokeDasharray="4 4" />
            <text x={z.x + 10} y={z.y + 20} fontSize={13} fill={oscuro ? "#a3a3a3" : "#5f594f"} style={{ fontFamily: "var(--f-senal)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{z.nombre}</text>
          </g>
        );
      })}
      {locales.map((l) => {
        const v = valorLocal?.get(l.id);
        const r = v !== undefined ? 10 + 22 * Math.sqrt(v / maxLocal) : 9;
        const sel = seleccionado === l.id;
        return (
          <g key={l.id} role={onLocal ? "button" : undefined} tabIndex={onLocal ? 0 : undefined} aria-label={onLocal ? `Editar ${l.nombre}` : undefined} onKeyDown={e => { if (onLocal && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onLocal(l); } }} onClick={(e) => { if (onLocal) { e.stopPropagation(); onLocal(l); } }} style={{ cursor: onLocal ? "pointer" : undefined }}>
            <title>{l.nombre} · Local {l.numero_local}</title>
            {v !== undefined && <circle cx={l.coord_x} cy={l.coord_y} r={r * 1.8} fill={colorCalor(v / maxLocal)} fillOpacity={0.25} />}
            <rect x={l.coord_x - 34} y={l.coord_y - 24} width={68} height={48} fill={oscuro ? "#242424" : "#fbfaf7"} stroke={sel ? "#f4b41a" : linea} strokeWidth={sel ? 2.5 : 1} opacity={l.activo ? 1 : 0.4} />
            <text x={l.coord_x} y={l.coord_y - 4} textAnchor="middle" fontSize={11} fill={tinta} style={{ fontFamily: "var(--f-texto)" }}>{l.nombre.length > 12 ? l.nombre.slice(0, 11) + "…" : l.nombre}</text>
            <text x={l.coord_x} y={l.coord_y + 12} textAnchor="middle" fontSize={10} fill={oscuro ? "#a3a3a3" : "#5f594f"} style={{ fontFamily: "var(--f-dato)" }}>{l.numero_local}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ------------------------------------------------------------------ gemelo digital isométrico
const C = 0.866;
const H = 0.5;
const K = 0.34;
const CX = 230;
const pts = (a: [number, number][]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

export function GemeloIso({
  plano, valorZona, maxZona, pulsos, ahora, pisoVisible, zonaSeleccionada, onZona, onHover, unidad,
}: {
  plano: Plano; valorZona: Map<string, number>; maxZona: number; pulsos: Map<string, number>; ahora: number; pisoVisible: string;
  zonaSeleccionada?: string | null; onZona?: (z: Zona) => void; onHover?: (z: Zona | null, pos?: { x: number; y: number }) => void; unidad: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const niveles = nivelesPlano(plano);
  const pisos = niveles.map(p=>p.id).filter(p=>pisoVisible==="todo"||p===pisoVisible);
  const altura = new Map(pisos.map((p,i)=>[p,34+(pisos.length-1-i)*180]));
  const P = (piso:string,x:number,y:number,z=0):[number,number] => [CX+(x-y)*C*K,(altura.get(piso)??34)+(x+y)*H*K-z];
  const altoVista = 90+Math.max(0,pisos.length-1)*180+(plano.ancho+plano.alto)*H*K;

  const porPiso = useMemo(() => {
    const m = new Map<string, { zonas: Zona[]; locales: LocalPlano[] }>();
    for (const p of nivelesPlano(plano).map(n=>n.id)) m.set(p, { zonas: plano.zonas.filter((z) => z.piso === p), locales: plano.locales.filter((l) => l.piso === p) });
    return m;
  }, [plano]);

  return (
    <svg viewBox={`0 0 ${Math.max(760,CX+plano.ancho*C*K+180)} ${altoVista}`} style={{ width: "100%", height: "100%" }} role={onZona ? "group" : "img"} aria-label="Gemelo digital del Paseo">

      {pisos.map((piso) => {
        const { zonas, locales } = porPiso.get(piso)!;
        const borde = pts([P(piso, 0, 0), P(piso, plano.ancho, 0), P(piso, plano.ancho, plano.alto), P(piso, 0, plano.alto)]);
        const etiqueta = P(piso, plano.ancho, 0);
        return (
          <g key={piso}>
            <polygon points={borde} fill="rgba(237,230,216,0.035)" stroke="#525252" />
            {zonas.map((z) => {
              const v = valorZona.get(z.id) ?? 0;
              const t = maxZona ? v / maxZona : 0;
              const [cx, cy] = P(piso, z.x + z.ancho / 2, z.y + z.alto / 2);
              const r = 26 + 70 * Math.sqrt(t) * Math.sqrt((z.ancho * z.alto) / (333 * 600));
              const pulso = pulsos.get(z.id);
              const reciente = pulso && ahora - pulso < 4000;
              return (
                <g key={z.id}>

                  {reciente && (
                    <ellipse cx={cx} cy={cy} rx={r * 0.6} ry={r * 0.6 * 0.577} fill="none" stroke="#f4b41a" strokeWidth={1.5}>
                      <animate attributeName="rx" from={r * 0.4} to={r * 1.3} dur="1.4s" repeatCount="2" />
                      <animate attributeName="ry" from={r * 0.4 * 0.577} to={r * 1.3 * 0.577} dur="1.4s" repeatCount="2" />
                      <animate attributeName="opacity" from="1" to="0" dur="1.4s" repeatCount="2" />
                    </ellipse>
                  )}
                  <polygon
                    points={pts([P(piso, z.x, z.y), P(piso, z.x + z.ancho, z.y), P(piso, z.x + z.ancho, z.y + z.alto), P(piso, z.x, z.y + z.alto)])}
                    fill={v > 0 ? colorCalor(t) : hover === z.id || zonaSeleccionada === z.id ? "#f4b41a" : "transparent"}
                    fillOpacity={v > 0 ? 0.18 + 0.24 * t : 0.1}
                    stroke={zonaSeleccionada === z.id ? "#f4b41a" : hover === z.id ? "#6b6152" : "transparent"}
                    strokeDasharray={zonaSeleccionada === z.id ? "4 3" : undefined}
                    style={{ cursor: onZona ? "pointer" : undefined }}
                    role={onZona ? "button" : undefined}
                    tabIndex={onZona ? 0 : undefined}
                    aria-label={onZona ? `Ver zona ${z.nombre}` : undefined}
                    onKeyDown={e => { if (onZona && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onZona(z); } }}
                    onMouseEnter={() => {
                      setHover(z.id);
                      onHover?.(z, { x: cx, y: cy });
                    }}
                    onMouseLeave={() => {
                      setHover(null);
                      onHover?.(null);
                    }}
                    onClick={() => onZona?.(z)}
                  >
                    <title>{`${z.nombre} · ${piso}: ${Math.round(v).toLocaleString("es-BO")} ${unidad}`}</title>
                  </polygon>
                </g>
              );
            })}
            {locales
              .slice()
              .sort((a, b) => Number(a.coord_x) + Number(a.coord_y) - (Number(b.coord_x) + Number(b.coord_y)))
              .map((l) => {
                const w = 60, d = 44, h = 9;
                const x = l.coord_x - w / 2, y = l.coord_y - d / 2;
                return (
                  <g key={l.id} opacity={l.activo ? 1 : 0.35}><title>{l.nombre} · {l.numero_local} · {l.activo ? "Activo" : "Inactivo"}</title>
                    <polygon points={pts([P(piso, x + w, y), P(piso, x + w, y + d), P(piso, x + w, y + d, h), P(piso, x + w, y, h)])} fill="#242424" stroke="#525252" strokeWidth={0.6} />
                    <polygon points={pts([P(piso, x, y + d), P(piso, x + w, y + d), P(piso, x + w, y + d, h), P(piso, x, y + d, h)])} fill="#1a1a1a" stroke="#525252" strokeWidth={0.6} />
                    <polygon points={pts([P(piso, x, y, h), P(piso, x + w, y, h), P(piso, x + w, y + d, h), P(piso, x, y + d, h)])} fill="#333333" stroke="#525252" strokeWidth={0.6} />
                  </g>
                );
              })}
            <text x={etiqueta[0] + 14} y={etiqueta[1] + 4} fill="#ffffff" fontSize={24} fontWeight={600} style={{ fontFamily: "var(--f-senal)", letterSpacing: "0.1em" }}>{piso}</text>
            <text x={etiqueta[0] + 14} y={etiqueta[1] + 28} fill="#a3a3a3" fontSize={16} style={{ fontFamily: "var(--f-senal)", letterSpacing: "0.14em" }}>{niveles.find(n=>n.id===piso)?.nombre.toUpperCase()}</text>
          </g>
        );
      })}
    </svg>
  );
}

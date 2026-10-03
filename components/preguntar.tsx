"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";

const SUGERENCIAS = ["Resumen de esta semana", "¿Cómo está la equidad del flujo?", "¿Qué debería hacer hoy?", "¿Cómo van las ofertas de la IA?", "¿Qué locales venden menos?", "¿Qué está pendiente de aprobar?"];

interface Columna { clave: string; titulo: string; tipo?: "texto" | "bs" | "entero" | "pct" | "porcentaje" | "decimal" }
interface Accion { tipo: "crear_promocion" | "generar_ofertas" | "ir"; etiqueta: string; datos?: any; ruta?: string }
interface Mensaje {
  id: string;
  rol: "admin" | "ia";
  texto: string;
  r?: { intencion: string; tabla?: { columnas: Columna[]; filas: any[] }; grafico?: { tipo: "barra" | "linea"; x: string; y: string; unidad?: string }; serie?: any[]; acciones?: Accion[]; sugerencias?: string[]; periodo?: string; motor?: string };
  error?: boolean;
}

const formato = (v: any, tipo?: Columna["tipo"]) => {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (tipo === "bs") return `Bs ${n.toLocaleString("es-BO", { maximumFractionDigits: 0 })}`;
  if (tipo === "entero") return n.toLocaleString("es-BO", { maximumFractionDigits: 0 });
  if (tipo === "pct") return `${n >= 0 ? "+" : ""}${n.toLocaleString("es-BO", { maximumFractionDigits: 1 })} %`;
  if (tipo === "porcentaje") return `${n.toLocaleString("es-BO", { maximumFractionDigits: 1 })} %`;
  if (tipo === "decimal") return n.toLocaleString("es-BO", { maximumFractionDigits: 2 });
  return String(v);
};

/**
 * Asistente del Centro de Inteligencia (HU-A15 ampliada): conversación con memoria sobre ventas, equidad
 * del flujo, ofertas de la IA, promociones, eventos, clientes y fraude. Cada respuesta puede traer una
 * tabla, un gráfico y acciones que se ejecutan con un clic (crear una promoción, regenerar ofertas).
 */
export function Preguntar({ oscuro = true, compacto = false }: { oscuro?: boolean; compacto?: boolean }) {
  const router = useRouter();
  const [pregunta, setPregunta] = useState("");
  const [hilo, setHilo] = useState<Mensaje[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [hechas, setHechas] = useState<Set<string>>(new Set());
  const fin = useRef<HTMLDivElement>(null);
  const tinta = oscuro ? "#ede6d8" : "#16140f";
  const gris = oscuro ? "#9a9182" : "#5f594f";
  const linea = oscuro ? "#2c2821" : "#e4ded3";

  useEffect(() => {
    api<any[]>("/admin/asistente/historial")
      .then((h) => setHilo(h.map((m) => ({ id: String(m.id), rol: m.rol === "cliente" ? "admin" : "ia", texto: m.texto }))))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [hilo, enviando]);

  async function enviar(texto: string) {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setPregunta("");
    setHilo((h) => [...h, { id: `a${Date.now()}`, rol: "admin", texto: t }]);
    try {
      const r = await api<any>("/admin/asistente", { cuerpo: { pregunta: t } });
      setHilo((h) => [...h, { id: `i${Date.now()}`, rol: "ia", texto: r.texto, r }]);
    } catch (e: any) {
      setHilo((h) => [...h, { id: `e${Date.now()}`, rol: "ia", texto: e.message, error: true }]);
    } finally {
      setEnviando(false);
    }
  }

  async function ejecutar(a: Accion, clave: string) {
    if (a.tipo === "ir" && a.ruta) return router.push(a.ruta);
    if (!confirm(`¿${a.etiqueta}?`)) return;
    try {
      if (a.tipo === "crear_promocion") await api("/admin/promociones", { cuerpo: a.datos });
      if (a.tipo === "generar_ofertas") await api("/admin/ofertas/generar", { cuerpo: { forzar: true } });
      setHechas((s) => new Set(s).add(clave));
      setHilo((h) => [...h, { id: `x${Date.now()}`, rol: "ia", texto: a.tipo === "crear_promocion" ? `Listo: creé «${a.datos.titulo}», ya está publicada en la app y Jarvis la recomienda.` : "Listo: regeneré las ofertas personales de hoy con los datos actuales." }]);
    } catch (e: any) {
      setHilo((h) => [...h, { id: `e${Date.now()}`, rol: "ia", texto: e.message, error: true }]);
    }
  }

  async function nueva() {
    await api("/admin/asistente/reiniciar", { cuerpo: {} }).catch(() => undefined);
    setHilo([]);
  }

  const ultima = [...hilo].reverse().find((m) => m.rol === "ia" && m.r);
  const chips = !hilo.length ? SUGERENCIAS : ultima?.r?.sugerencias ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0, flex: 1, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="senal" style={{ color: oscuro ? "var(--sala-oro)" : "var(--oro)" }}>Asistente de datos</span>
        {hilo.length > 0 && <button className="enlace" style={{ color: gris, fontSize: 11 }} onClick={() => void nueva()}>Nueva conversación</button>}
      </div>
      <div style={{ overflowY: "auto", display: "grid", gap: 14, minHeight: 0, flex: 1, maxHeight: compacto ? 360 : undefined, alignContent: "start" }}>
        {hilo.map((m) =>
          m.rol === "admin" ? (
            <p key={m.id} className="display" style={{ fontStyle: "italic", fontSize: 16, margin: 0, color: tinta, borderTop: `1px solid ${linea}`, paddingTop: 10 }}>{m.texto}</p>
          ) : (
            <div key={m.id} style={{ display: "grid", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 13, color: m.error ? "#e0645a" : tinta, lineHeight: 1.5 }}>{m.texto}</p>
              {m.r?.grafico?.tipo === "linea" && (m.r.serie ?? m.r.tabla?.filas)?.length ? (
                <div style={{ height: compacto ? 120 : 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(m.r.serie ?? m.r.tabla?.filas ?? []).slice(0, 60)}>
                      <XAxis dataKey={m.r.grafico.x} tick={{ fontSize: 10, fill: gris }} tickLine={false} axisLine={false} minTickGap={16} />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ background: "#15130f", border: "1px solid #2c2821", fontSize: 12, color: "#ede6d8" }} />
                      <Line dataKey={m.r.grafico.y} stroke="#d4ae5c" dot={false} strokeWidth={1.6} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
              {m.r?.grafico?.tipo === "barra" && (m.r.serie ?? m.r.tabla?.filas)?.length ? (
                <BarrasHtml filas={(m.r.serie ?? m.r.tabla?.filas ?? []).slice(0, 8)} x={m.r.grafico.x} y={m.r.grafico.y} unidad={m.r.grafico.unidad} tinta={tinta} gris={gris} />
              ) : null}
              {m.r?.tabla?.filas?.length && !compacto ? (
                <div style={{ overflowX: "auto" }}>
                  <table className="libro" style={{ fontSize: 12, color: tinta }}>
                    <thead><tr>{m.r.tabla.columnas.map((c) => <th key={c.clave} className={c.tipo && c.tipo !== "texto" ? "der" : ""} style={{ color: gris }}>{c.titulo}</th>)}</tr></thead>
                    <tbody>
                      {m.r.tabla.filas.slice(0, 12).map((f, i) => (
                        <tr key={i}>{m.r!.tabla!.columnas.map((c) => <td key={c.clave} className={c.tipo && c.tipo !== "texto" ? "der" : ""}>{formato(f[c.clave], c.tipo)}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {m.r?.acciones?.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {m.r.acciones.map((a, i) => {
                    const clave = `${m.id}-${i}`;
                    const hecha = hechas.has(clave);
                    return (
                      <button key={clave} className={`btn chico ${a.tipo === "ir" ? "claro" : "oro"}`} disabled={hecha} onClick={() => void ejecutar(a, clave)} style={{ textTransform: "none", letterSpacing: 0, color: a.tipo === "ir" ? tinta : undefined, borderColor: a.tipo === "ir" ? linea : undefined }}>
                        {hecha ? `✓ ${a.etiqueta}` : a.etiqueta}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {m.r && <span style={{ fontSize: 10, color: gris }}>{m.r.periodo ? `${m.r.periodo} · ` : ""}{m.r.motor === "datos" ? "consulta en vivo" : `redactado por ${m.r.motor?.replace("ollama:", "IA local ")}`}</span>}
            </div>
          ),
        )}
        {enviando && <p style={{ margin: 0, fontSize: 12, color: gris }}>Consultando los datos del Paseo…</p>}
        <div ref={fin} />
      </div>
      {chips.length > 0 && !enviando && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {chips.slice(0, compacto ? 3 : 6).map((s) => (
            <button key={s} className="btn claro chico" style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--f-texto)", fontWeight: 400, fontSize: 12, color: tinta, borderColor: linea }} onClick={() => void enviar(s)}>{s}</button>
          ))}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); void enviar(pregunta); }} style={{ display: "flex", gap: 6 }}>
        <input className="entrada" value={pregunta} onChange={(e) => setPregunta(e.target.value)} placeholder="Pregunta sobre ventas, equidad, ofertas, locales…" aria-label="Pregunta" />
        <button className="btn" disabled={enviando}>{enviando ? "…" : "Preguntar"}</button>
      </form>
    </div>
  );
}

/** Barras horizontales en HTML: legibles en la consola oscura y sin dependencias de layout. */
function BarrasHtml({ filas, x, y, unidad, tinta, gris }: { filas: any[]; x: string; y: string; unidad?: string; tinta: string; gris: string }) {
  const max = Math.max(1, ...filas.map((f) => Number(f[y]) || 0));
  const fmt = (v: number) => `${v.toLocaleString("es-BO", { maximumFractionDigits: 1 })}${unidad === "%" ? " %" : unidad === "Bs" ? " Bs" : ""}`;
  return (
    <div style={{ display: "grid", gap: 5, margin: "4px 0 8px" }}>
      {filas.map((f, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 1fr 72px", gap: 8, alignItems: "center", fontSize: 11 }}>
          <span style={{ color: gris, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(f[x])}>{String(f[x])}</span>
          <i style={{ display: "block", height: 6, width: `${(100 * Math.max(0, Number(f[y]) || 0)) / max}%`, background: "#d4ae5c" }} />
          <b style={{ fontWeight: 500, color: tinta, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(Number(f[y]) || 0)}</b>
        </div>
      ))}
    </div>
  );
}

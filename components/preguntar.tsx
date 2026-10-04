"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ListaPaginada } from "@/components/admin-ui";
import { api } from "@/lib/api";
import { useGrabacion } from "@/lib/use-grabacion";

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
  const [errorVoz, setErrorVoz] = useState("");
  const [hechas, setHechas] = useState<Set<string>>(new Set());
  const fin = useRef<HTMLDivElement>(null);
  const conversando = useRef(false);
  const voz = useGrabacion(audio => void enviarAudio(audio), setErrorVoz);
  const ocupado = enviando || voz.estado !== "inactivo";
  const tinta = oscuro ? "#ffffff" : "#16140f";
  const gris = oscuro ? "#a3a3a3" : "#5f594f";
  const linea = oscuro ? "#303030" : "#e4ded3";

  useEffect(() => {
    api<any[]>("/admin/asistente/historial")
      .then((h) => { if (!conversando.current) setHilo(h.map((m) => ({ id: String(m.id), rol: m.rol === "cliente" ? "admin" : "ia", texto: m.texto }))); })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [hilo, enviando]);

  async function enviar(texto: string) {
    const t = texto.trim();
    if (!t || ocupado) return;
    conversando.current = true;
    setErrorVoz("");
    setEnviando(true);
    setPregunta("");
    setHilo((h) => [...h, { id: `a${Date.now()}`, rol: "admin", texto: t }]);
    try {
      const r = await api<any>("/admin/asistente", { cuerpo: { pregunta: t } });
      setHilo((h) => [...h, ...(r.secciones?.length ? r.secciones : [r]).map((parte: any, i: number) => ({ id: `i${Date.now()}-${i}`, rol: "ia" as const, texto: parte.texto, r: parte }))]);
    } catch (e: any) {
      setHilo((h) => [...h, { id: `e${Date.now()}`, rol: "ia", texto: e.message, error: true }]);
    } finally {
      setEnviando(false);
    }
  }

  async function enviarAudio(audio: Blob) {
    conversando.current = true;
    setEnviando(true);
    setErrorVoz("");
    try {
      const formulario = new FormData();
      formulario.append("audio", audio, audio.type.includes("mp4") ? "pregunta.m4a" : "pregunta.webm");
      const resultado = await api<any>("/admin/asistente/voz", { formulario });
      if (!resultado.texto?.trim() || !resultado.respuesta) {
        setErrorVoz("No se reconoció una pregunta en el audio. Habla cerca del micrófono e inténtalo de nuevo.");
        return;
      }
      const r = resultado.respuesta;
      setHilo(h => [...h, { id: `a${Date.now()}`, rol: "admin", texto: resultado.texto }, ...(r.secciones?.length ? r.secciones : [r]).map((parte: any, i: number) => ({ id: `i${Date.now()}-${i}`, rol: "ia" as const, texto: parte.texto, r: parte }))]);
    } catch (error) {
      setErrorVoz(error instanceof Error ? error.message : "No se pudo procesar el audio. Inténtalo de nuevo.");
    } finally { setEnviando(false); }
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
    if (ocupado) return;
    conversando.current = true;
    await api("/admin/asistente/reiniciar", { cuerpo: {} }).catch(() => undefined);
    setHilo([]);
  }

  const ultima = [...hilo].reverse().find((m) => m.rol === "ia" && m.r);
  const chips = !hilo.length ? SUGERENCIAS : ultima?.r?.sugerencias ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0, flex: 1, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="senal" style={{ color: oscuro ? "var(--sala-oro)" : "var(--oro)" }}>Asistente de datos</span>
        {hilo.length > 0 && <button className="enlace" disabled={ocupado} style={{ color: gris, fontSize: 11 }} onClick={() => void nueva()}>Nueva conversación</button>}
      </div>
      <div style={{ overflowY: "auto", display: "grid", gap: 14, minHeight: 0, flex: 1, maxHeight: compacto ? 360 : undefined, alignContent: "start" }}>
        {hilo.map((m) =>
          m.rol === "admin" ? (
            <p key={m.id} className="display" style={{ fontStyle: "italic", fontSize: 16, margin: 0, color: tinta, borderTop: `1px solid ${linea}`, paddingTop: 10 }}>{m.texto}</p>
          ) : (
            <div key={m.id} style={{ display: "grid", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 13, color: m.error ? "#e0645a" : tinta, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m.texto}</p>
              {m.r?.grafico?.tipo === "linea" && (m.r.serie ?? m.r.tabla?.filas)?.length ? (
                <div style={{ height: compacto ? 120 : 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(m.r.serie ?? m.r.tabla?.filas ?? [])}>
                      <XAxis dataKey={m.r.grafico.x} tick={{ fontSize: 10, fill: gris }} tickLine={false} axisLine={false} minTickGap={16} />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #303030", fontSize: 12, color: "#ffffff" }} />
                      <Line dataKey={m.r.grafico.y} stroke="#f4b41a" dot={false} strokeWidth={1.6} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
              {m.r?.grafico?.tipo === "barra" && (m.r.serie ?? m.r.tabla?.filas)?.length ? (
                <BarrasHtml filas={(m.r.serie ?? m.r.tabla?.filas ?? [])} x={m.r.grafico.x} y={m.r.grafico.y} unidad={m.r.grafico.unidad} tinta={tinta} gris={gris} />
              ) : null}
              {m.r?.tabla?.filas?.length && !compacto ? (
                <ListaPaginada<any> datos={m.r.tabla.filas} nombre="resultados">{filas => (
                  <table className="libro" style={{ fontSize: 12, color: tinta }}>
                    <thead><tr>{m.r!.tabla!.columnas.map((c) => <th key={c.clave} className={c.tipo && c.tipo !== "texto" ? "der" : ""} style={{ color: gris }}>{c.titulo}</th>)}</tr></thead>
                    <tbody>
                      {filas.map((f, i) => (
                        <tr key={i}>{m.r!.tabla!.columnas.map((c) => <td key={c.clave} className={c.tipo && c.tipo !== "texto" ? "der" : ""}>{formato(f[c.clave], c.tipo)}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                )}</ListaPaginada>
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
              {m.r && <span style={{ fontSize: 10, color: gris }}>{m.r.periodo ? `${m.r.periodo} · ` : ""}{m.r.motor === "comprension+datos" ? "comprensión contextual · datos del sistema" : "datos del sistema"}</span>}
            </div>
          ),
        )}
        {enviando && <p style={{ margin: 0, fontSize: 12, color: gris }}>Consultando los datos del Paseo…</p>}
        <div ref={fin} />
      </div>
      {chips.length > 0 && !ocupado && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {chips.slice(0, compacto ? 3 : 6).map((s) => (
            <button key={s} className="btn claro chico" style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--f-texto)", fontWeight: 400, fontSize: 12, color: tinta, borderColor: linea }} onClick={() => void enviar(s)}>{s}</button>
          ))}
        </div>
      )}
      {voz.estado !== "inactivo" && <div className="asistente-grabacion" role="status">
        <span>{voz.estado === "permiso" ? "Permite el acceso al micrófono…" : `Grabando ${Math.floor(voz.segundos / 60)}:${String(voz.segundos % 60).padStart(2, "0")} · máximo 2 minutos`}</span>
        <button type="button" className="enlace" onClick={voz.cancelar}>Cancelar audio</button>
      </div>}
      {errorVoz && <p role="alert" style={{ margin: 0, fontSize: 13, color: "#ef9b8f" }}>{errorVoz}</p>}
      <form className="asistente-compositor" onSubmit={(e) => { e.preventDefault(); void enviar(pregunta); }}>
        <textarea rows={2} maxLength={6000} className="entrada" value={pregunta} onChange={(e) => setPregunta(e.target.value)} placeholder="Pregunta sobre ventas, equidad, ofertas, locales…" aria-label="Pregunta" />
        <button type="button" className={`btn claro ${voz.estado === "grabando" ? "grabando" : ""}`} disabled={enviando || voz.estado === "permiso"} aria-label={voz.estado === "grabando" ? "Detener y enviar audio" : "Preguntar por voz"} onClick={() => { setErrorVoz(""); if (voz.estado === "grabando") voz.detener(); else void voz.empezar(); }}>
          {voz.estado === "grabando" ? "Enviar audio" : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" /></svg><span>Hablar</span></>}
        </button>
        <button className="btn" disabled={ocupado || !pregunta.trim()}>{enviando ? "…" : "Preguntar"}</button>
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
          <i style={{ display: "block", height: 6, width: `${(100 * Math.max(0, Number(f[y]) || 0)) / max}%`, background: "#f4b41a" }} />
          <b style={{ fontWeight: 500, color: tinta, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(Number(f[y]) || 0)}</b>
        </div>
      ))}
    </div>
  );
}

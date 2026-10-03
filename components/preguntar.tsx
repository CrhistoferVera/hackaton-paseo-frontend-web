"use client";

import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";

const SUGERENCIAS = ["¿Qué locales comparten más clientes con el cine?", "¿Cuáles son las horas pico?", "¿Qué buscan los clientes que no encuentran?", "Ventas por categoría"];

/** HU-A15: pregunta en lenguaje natural → respuesta, gráfico y SQL generado sobre vistas oro. */
export function Preguntar({ oscuro = true, compacto = false }: { oscuro?: boolean; compacto?: boolean }) {
  const [pregunta, setPregunta] = useState("");
  const [hilo, setHilo] = useState<any[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [verSql, setVerSql] = useState<number | null>(null);
  const tinta = oscuro ? "#ede6d8" : "#16140f";
  const gris = oscuro ? "#9a9182" : "#5f594f";

  async function enviar(texto: string) {
    if (!texto.trim()) return;
    setEnviando(true);
    setPregunta("");
    try {
      const r = await api("/admin/inteligencia/preguntar", { cuerpo: { pregunta: texto } });
      setHilo((h) => [...h, r]);
    } catch (e: any) {
      setHilo((h) => [...h, { pregunta: texto, respuesta: e.message, error: true }]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: compacto ? 420 : undefined }}>
      <span className="senal" style={{ color: oscuro ? "var(--sala-oro)" : "var(--oro)" }}>Pregúntale a tus datos</span>
      <div style={{ overflowY: "auto", display: "grid", gap: 14 }}>
        {hilo.map((r, i) => (
          <div key={i} style={{ borderTop: `1px solid ${oscuro ? "#2c2821" : "#e4ded3"}`, paddingTop: 10 }}>
            <p className="display" style={{ fontStyle: "italic", fontSize: 16, margin: "0 0 6px", color: tinta }}>{r.pregunta}</p>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: r.error ? "#e0645a" : tinta, lineHeight: 1.45 }}>{r.respuesta}</p>
            {r.filas?.length > 0 && r.grafico?.tipo === "linea" && r.grafico?.x && r.grafico?.y && (
              <div style={{ height: 150 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={r.filas.slice(0, 40)}>
                    <XAxis dataKey={r.grafico.x} tick={{ fontSize: 10, fill: gris }} tickLine={false} axisLine={false} minTickGap={16} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: "#15130f", border: "1px solid #2c2821", fontSize: 12, color: "#ede6d8" }} />
                    <Line dataKey={r.grafico.y} stroke="#d4ae5c" dot={false} strokeWidth={1.6} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {r.filas?.length > 0 && r.grafico?.tipo === "barra" && r.grafico?.x && r.grafico?.y && (
              <BarrasHtml filas={r.filas.slice(0, 8)} x={r.grafico.x} y={r.grafico.y} unidad={r.grafico.unidad} tinta={tinta} gris={gris} />
            )}
            {r.sql && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: gris }}>
                <span>{r.fuente === "llm" ? "Generado por Claude" : "Plantilla"} · {r.filas?.length ?? 0} filas · vistas oro, k ≥ 5</span>
                <button className="enlace" style={{ color: tinta, fontSize: 11 }} onClick={() => setVerSql(verSql === i ? null : i)}>{verSql === i ? "Ocultar SQL" : "Ver SQL generado"}</button>
              </div>
            )}
            {verSql === i && <pre className="dato" style={{ fontSize: 11, whiteSpace: "pre-wrap", background: oscuro ? "#0f0e0b" : "#f3f0ea", padding: 10, margin: "8px 0 0", color: tinta }}>{r.sql}</pre>}
          </div>
        ))}
        {!hilo.length && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {SUGERENCIAS.map((s) => (
              <button key={s} className="btn claro chico" style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--f-texto)", fontWeight: 400, fontSize: 12 }} onClick={() => enviar(s)}>{s}</button>
            ))}
          </div>
        )}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void enviar(pregunta); }} style={{ display: "flex", gap: 6 }}>
        <input className="entrada" value={pregunta} onChange={(e) => setPregunta(e.target.value)} placeholder="Escribe una pregunta sobre el Paseo" aria-label="Pregunta" />
        <button className="btn" disabled={enviando}>{enviando ? "…" : "Preguntar"}</button>
      </form>
    </div>
  );
}

/** Barras horizontales en HTML: legibles en la consola oscura y sin dependencias de layout. */
function BarrasHtml({ filas, x, y, unidad, tinta, gris }: { filas: any[]; x: string; y: string; unidad?: string; tinta: string; gris: string }) {
  const max = Math.max(1, ...filas.map((f) => Number(f[y]) || 0));
  const fmt = (v: number) => `${v.toLocaleString("es-BO")}${unidad === "%" ? " %" : unidad === "Bs" ? " Bs" : ""}`;
  return (
    <div style={{ display: "grid", gap: 5, margin: "4px 0 8px" }}>
      {filas.map((f, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr 64px", gap: 8, alignItems: "center", fontSize: 11 }}>
          <span style={{ color: gris, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(f[x])}>{String(f[x])}</span>
          <i style={{ display: "block", height: 6, width: `${(100 * (Number(f[y]) || 0)) / max}%`, background: "#d4ae5c" }} />
          <b style={{ fontWeight: 500, color: tinta, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(Number(f[y]) || 0)}</b>
        </div>
      ))}
    </div>
  );
}

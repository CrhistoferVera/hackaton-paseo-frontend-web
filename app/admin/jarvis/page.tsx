"use client";

import { useState } from "react";
import { Cabecera, Cargando, Indicador, Mensajes, Seccion } from "@/components/marco";
import { api } from "@/lib/api";
import { entero, fechaHora } from "@/lib/formato";
import { useSesion } from "@/lib/sesion";
import { useTiempoReal } from "@/lib/tiempo-real";
import { useAccion, useDatos } from "@/lib/use-datos";

const DISPARADOR: Record<string, string> = {
  ruta_recojo: "Ruta de recojo (compra PaseoYa)",
  espera_comida: "Itinerario durante la espera",
  pedido_listo: "Pedido listo",
  venta_cruzada: "Venta cruzada al escanear",
  bienvenida: "Bienvenida al llegar",
  drop_cercano: "Drop cercano",
};
const COLOR_TIPO: Record<string, string> = { pasillo: "#9a9182", local: "#16140f", hito: "#c99a3a", entrada: "#3f7a5c", escalera: "#8e6a1e", ascensor: "#8e6a1e" };

/** Jarvis proactivo: qué motor responde, con qué latencia y qué le está diciendo a los clientes. Grafo del edificio. */
export default function JarvisAdmin() {
  const { usuario } = useSesion();
  const { datos, recargar } = useDatos<any>("/admin/jarvis");
  const { datos: grafo, recargar: recargarGrafo } = useDatos<any>("/recinto/grafo");
  const [piso, setPiso] = useState("N1");
  const a = useAccion();
  useTiempoReal({ jarvis: () => void recargar() });

  const total = datos?.motores?.reduce((s: number, m: any) => s + m.ordenes, 0) ?? 0;
  const local = datos?.motores?.find((m: any) => m.motor.startsWith("ollama"));
  const nodos = (grafo?.nodos ?? []).filter((n: any) => n.piso === piso);
  const porId = new Map<string, any>((grafo?.nodos ?? []).map((n: any) => [n.id, n]));

  return (
    <>
      <Cabecera ceja="Asistente de voz" titulo="Jarvis" descripcion="Jarvis reacciona a lo que hace cada cliente y le habla con la voz de su propio teléfono. El texto lo redacta un modelo local (Ollama), sin costo por cliente; si no responde a tiempo o cambia un dato, se usa la plantilla.">
        {usuario?.rol === "admin" && (
          <button className="btn claro" onClick={() => a.ejecutar(async () => { const r = await api("/admin/jarvis/grafo/reconstruir", { cuerpo: {} }); await recargarGrafo(); return r; }, (r: any) => `Grafo reconstruido: ${r.nodos} nodos, ${r.aristas} conexiones`)}>
            Reconstruir grafo
          </button>
        )}
      </Cabecera>
      <Mensajes error={a.error} exito={a.exito} />
      {!datos ? <Cargando /> : (
        <>
          <div className="indicadores">
            {datos.disponibilidad.map((m: any) => (
              <Indicador key={m.motor} etiqueta={m.motor} valor={m.disponible ? "Activo" : "Apagado"} detalle={m.motor.startsWith("ollama") ? "Modelo local" : "Nube, opcional"} oro={m.disponible} />
            ))}
            {datos.oido && (
              <Indicador etiqueta="Reconocimiento de voz" valor={datos.oido.listo ? "Activo" : datos.oido.activo ? "Cargando" : "Apagado"} detalle={`${datos.oido.modelo.split("/").pop()} · local`} oro={datos.oido.listo} />
            )}
            <Indicador etiqueta="Órdenes de voz · 7 días" valor={entero(total)} />
            <Indicador etiqueta="Latencia del modelo local" valor={local ? `${entero(local.latencia_mediana)} ms` : "—"} detalle={local ? `mediana · ${entero(local.ordenes)} órdenes` : "sin datos"} />
          </div>
          <div className="dos-col">
            <Seccion titulo="Qué dispara a Jarvis">
              <table className="libro">
                <tbody>
                  {datos.disparadores.map((d: any) => (
                    <tr key={d.disparador}><td>{DISPARADOR[d.disparador] ?? d.disparador}</td><td className="der">{entero(d.ordenes)}</td></tr>
                  ))}
                </tbody>
              </table>
            </Seccion>
            <Seccion titulo="Motores">
              <table className="libro">
                <thead><tr><th>Motor</th><th className="der">Órdenes</th><th className="der">Promedio</th><th className="der">Mediana</th></tr></thead>
                <tbody>
                  {datos.motores.map((m: any) => (
                    <tr key={m.motor}><td>{m.motor}</td><td className="der">{entero(m.ordenes)}</td><td className="der">{entero(m.latencia_promedio)} ms</td><td className="der">{entero(m.latencia_mediana)} ms</td></tr>
                  ))}
                </tbody>
              </table>
            </Seccion>
          </div>
          <Seccion titulo="Lo último que dijo Jarvis">
            <table className="libro">
              <thead><tr><th>Hora</th><th>Cliente</th><th>Disparador</th><th>Mensaje</th><th>Motor</th><th className="der">ms</th></tr></thead>
              <tbody>
                {datos.ordenes.map((o: any) => (
                  <tr key={o.id}>
                    <td className="num">{fechaHora(o.creado_en)}</td>
                    <td>{o.cliente}</td>
                    <td><span className="etiqueta tenue">{DISPARADOR[o.disparador] ?? o.disparador}</span></td>
                    <td style={{ maxWidth: 460 }}>{o.texto}</td>
                    <td className="dato" style={{ fontSize: 12 }}>{o.motor}</td>
                    <td className="der">{entero(o.latencia_ms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Seccion>
        </>
      )}
      <Seccion titulo="Grafo del edificio" accion={<div className="segmentado">{["N1", "N2", "T"].map((p) => <button key={p} className={piso === p ? "on" : ""} onClick={() => setPiso(p)}>{p}</button>)}</div>}>
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>Nodos de ubicación (pasillos, locales, carteles, accesos, escalera y ascensor) y sus conexiones en metros. Jarvis calcula las rutas y el contexto cercano sobre este grafo; se regenera solo cuando se mueve un local en el plano.</p>
        {!grafo ? <Cargando /> : (
          <svg viewBox="-20 -20 1060 640" style={{ width: "100%", background: "#fff", border: "1px solid var(--linea)" }}>
            <rect x={0} y={250} width={1000} height={100} fill="#f3f0ea" />
            {grafo.aristas.filter(([d, h]: string[]) => porId.get(d)?.piso === piso && porId.get(h)?.piso === piso).map(([d, h, m]: [string, string, number]) => {
              const a = porId.get(d);
              const b = porId.get(h);
              return (
                <g key={d + h}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#cbc2b2" strokeWidth={2} />
                  {m >= 10 && <text x={(a.x + b.x) / 2 + 4} y={(a.y + b.y) / 2 - 4} fontSize={11} fill="#9a9182">{Math.round(m)} m</text>}
                </g>
              );
            })}
            {nodos.map((n: any) => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={n.tipo === "pasillo" ? 5 : 9} fill={COLOR_TIPO[n.tipo]} />
                {n.tipo !== "pasillo" && <text x={n.x + 12} y={n.y + 4} fontSize={13} fill="#16140f">{n.nombre.split(",")[0]}</text>}
              </g>
            ))}
          </svg>
        )}
      </Seccion>
    </>
  );
}

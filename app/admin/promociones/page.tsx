"use client";

import { useState } from "react";
import { Cabecera, Cargando, Mensajes, PanelLateral } from "@/components/marco";
import { api } from "@/lib/api";
import { diasAtrasIso, fecha, fechaHora, hoyIso } from "@/lib/formato";
import { useAccion, useDatos } from "@/lib/use-datos";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** HU-A06: bandeja de promociones de los locales; aprobar o rechazar con comentario. También promociones del Paseo por segmento. */
export default function Promociones() {
  const [estado, setEstado] = useState("pendiente");
  const { datos, recargar } = useDatos<any[]>(`/admin/promociones${estado ? `?estado=${estado}` : ""}`);
  const { datos: segmentos } = useDatos<any[]>("/admin/inteligencia/segmentos");
  const { datos: plano } = useDatos<any>("/recinto/plano");
  const [rechazo, setRechazo] = useState<{ id: string; comentario: string } | null>(null);
  const [nueva, setNueva] = useState<any | null>(null);
  const a = useAccion();

  async function revisar(id: string, e: "aprobada" | "rechazada", comentario?: string) {
    const r = await a.ejecutar(() => api(`/admin/promociones/${id}/revision`, { cuerpo: { estado: e, comentario } }), e === "aprobada" ? "Aprobada y visible en la app" : "Rechazada; el local recibió tu comentario");
    if (r) {
      setRechazo(null);
      void recargar();
    }
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const r = await a.ejecutar(() => api("/admin/promociones", { cuerpo: { ...nueva, multiplicador: Number(nueva.multiplicador), localId: nueva.localId || null, segmentoId: nueva.segmentoId || null } }), "Promoción publicada");
    if (r) {
      setNueva(null);
      void recargar();
    }
  }

  return (
    <>
      <Cabecera ceja="Programa" titulo="Promociones" descripcion="Los locales proponen; el Paseo aprueba. También puedes crear promociones dirigidas a un segmento.">
        <div className="segmentado">{[["pendiente", "Por revisar"], ["aprobada", "Aprobadas"], ["rechazada", "Rechazadas"], ["", "Todas"]].map(([v, t]) => <button key={v} className={estado === v ? "on" : ""} onClick={() => setEstado(v)}>{t}</button>)}</div>
        <button className="btn" onClick={() => setNueva({ titulo: "", tipo: "puntos_dobles", multiplicador: 2, descripcion: "", localId: "", segmentoId: "", diasSemana: [0, 1, 2, 3, 4, 5, 6], horaInicio: "10:00", horaFin: "22:00", inicio: hoyIso(), fin: diasAtrasIso(-14) })}>Nueva promoción</button>
      </Cabecera>
      <Mensajes error={a.error} exito={a.exito} />
      {!datos ? <Cargando /> : !datos.length ? <div className="vacio">No hay promociones en este estado.</div> : (
        <table className="libro">
          <thead><tr><th>Promoción</th><th>Local</th><th>Cuándo</th><th>Segmento</th><th>Enviada</th><th /></tr></thead>
          <tbody>
            {datos.map((p) => (
              <tr key={p.id}>
                <td>{p.titulo}<small>{p.tipo === "puntos_dobles" ? `Puntos ×${Number(p.multiplicador)}` : "Cupón"} · {p.descripcion}</small>{p.comentario && <small>Comentario: {p.comentario}</small>}</td>
                <td>{p.local ?? "Todo el Paseo"}</td>
                <td style={{ fontSize: 13 }}>{p.dias_semana.map((d: number) => DIAS[d]).join(" ")} · {p.hora_inicio.slice(0, 5)}–{p.hora_fin.slice(0, 5)}<small>{fecha(p.inicio)} a {fecha(p.fin)}</small></td>
                <td>{p.segmento ?? "Todos"}</td>
                <td>{p.creado_por_nombre}<small>{fechaHora(p.creado_en)}</small></td>
                <td className="der">
                  {p.estado === "pendiente" ? (
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="btn chico" onClick={() => revisar(p.id, "aprobada")}>Aprobar</button>
                      <button className="btn chico claro" onClick={() => setRechazo({ id: p.id, comentario: "" })}>Rechazar</button>
                    </div>
                  ) : <span className={`etiqueta ${p.estado === "aprobada" ? "exito" : "alerta"}`}>{p.estado}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <PanelLateral abierto={!!rechazo} titulo="Rechazar promoción" onCerrar={() => setRechazo(null)}>
        {rechazo && (
          <form onSubmit={(e) => { e.preventDefault(); void revisar(rechazo.id, "rechazada", rechazo.comentario); }} style={{ display: "grid", gap: 14 }}>
            <label className="campo"><span>Comentario para el local</span><textarea required rows={4} value={rechazo.comentario} onChange={(e) => setRechazo({ ...rechazo, comentario: e.target.value })} placeholder="Ya hay una promoción similar en ese horario…" /></label>
            <button className="btn peligro">Rechazar con comentario</button>
          </form>
        )}
      </PanelLateral>
      <PanelLateral abierto={!!nueva} titulo="Nueva promoción del Paseo" onCerrar={() => setNueva(null)}>
        {nueva && (
          <form onSubmit={crear} style={{ display: "grid", gap: 14 }}>
            <label className="campo"><span>Título</span><input required value={nueva.titulo} onChange={(e) => setNueva({ ...nueva, titulo: e.target.value })} /></label>
            <label className="campo"><span>Descripción</span><input value={nueva.descripcion} onChange={(e) => setNueva({ ...nueva, descripcion: e.target.value })} /></label>
            <div className="fila-campos">
              <label className="campo"><span>Tipo</span><select value={nueva.tipo} onChange={(e) => setNueva({ ...nueva, tipo: e.target.value })}><option value="puntos_dobles">Puntos multiplicados</option><option value="cupon">Cupón</option></select></label>
              <label className="campo"><span>Multiplicador</span><input type="number" step="0.5" min="1" value={nueva.multiplicador} onChange={(e) => setNueva({ ...nueva, multiplicador: e.target.value })} /></label>
            </div>
            <label className="campo">
              <span>Local</span>
              <select value={nueva.localId} onChange={(e) => setNueva({ ...nueva, localId: e.target.value })}>
                <option value="">Todo el Paseo</option>
                {plano?.locales.map((l: any) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </label>
            <label className="campo">
              <span>Segmento</span>
              <select value={nueva.segmentoId} onChange={(e) => setNueva({ ...nueva, segmentoId: e.target.value })}>
                <option value="">Todos</option>
                {segmentos?.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </label>
            <div className="fila-campos">
              <label className="campo"><span>Desde</span><input type="time" value={nueva.horaInicio} onChange={(e) => setNueva({ ...nueva, horaInicio: e.target.value })} /></label>
              <label className="campo"><span>Hasta</span><input type="time" value={nueva.horaFin} onChange={(e) => setNueva({ ...nueva, horaFin: e.target.value })} /></label>
            </div>
            <div className="fila-campos">
              <label className="campo"><span>Inicio</span><input type="date" value={nueva.inicio} onChange={(e) => setNueva({ ...nueva, inicio: e.target.value })} /></label>
              <label className="campo"><span>Fin</span><input type="date" value={nueva.fin} onChange={(e) => setNueva({ ...nueva, fin: e.target.value })} /></label>
            </div>
            <Mensajes error={a.error} />
            <button className="btn" disabled={a.enviando}>Publicar</button>
          </form>
        )}
      </PanelLateral>
    </>
  );
}

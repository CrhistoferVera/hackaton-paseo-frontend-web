"use client";

import { useTiempoReal } from "@/lib/tiempo-real";
import { useState } from "react";
import { Cabecera, Cargando, Mensajes, PanelLateral, Seccion } from "@/components/marco";
import { api } from "@/lib/api";
import { ESTADO_REVISION, TIPOS_EVENTO, bs, fechaHora, hora, isoLocal } from "@/lib/formato";
import { useAccion, useDatos } from "@/lib/use-datos";

const VACIO = { titulo: "", descripcion: "", tipo: "concierto", inicio: "", fin: "", zonaId: "", localId: "", lugar: "", precioBs: "", cupos: "", puntos: "20" };

/** Eventos del Paseo: los crea marketing o los proponen los comercios; al aprobarse aparecen en la app y Jarvis los recomienda. */
export default function EventosAdmin() {
  const [filtro, setFiltro] = useState<"proximos" | "pendiente" | "todos">("pendiente");
  const { datos, recargar } = useDatos<any[]>(`/admin/eventos${filtro === "pendiente" ? "?estado=pendiente" : ""}`);
  const { datos: plano } = useDatos<any>("/recinto/plano");
  const a = useAccion();
  useTiempoReal({ eventos: () => void recargar(), catalogo: () => void recargar(), connect: () => void recargar() });
  const [f, setF] = useState<typeof VACIO | null>(null);

  const lista = (datos ?? []).filter((e) => filtro !== "proximos" || new Date(e.fin) > new Date()).sort((x, y) => (filtro === "proximos" ? +new Date(x.inicio) - +new Date(y.inicio) : 0));
  const pendientes = (datos ?? []).filter((e) => e.estado === "pendiente").length;

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!f) return;
    const cuerpo = {
      titulo: f.titulo, descripcion: f.descripcion, tipo: f.tipo, inicio: isoLocal(f.inicio), fin: isoLocal(f.fin),
      zonaId: f.zonaId || null, localId: f.localId || null, lugar: f.lugar || undefined,
      precioBs: f.precioBs === "" ? null : Number(f.precioBs), cupos: f.cupos === "" ? null : Number(f.cupos), puntos: Number(f.puntos || 0),
    };
    const r = await a.ejecutar(() => api("/admin/eventos", { cuerpo }), "Evento publicado");
    if (r) {
      setF(null);
      void recargar();
    }
  }

  async function revisar(ev: any, estado: "aprobada" | "rechazada" | "cancelada") {
    let comentario: string | undefined;
    let puntos: number | undefined;
    if (estado === "aprobada") {
      const p = prompt(`Puntos para quienes asistan a «${ev.titulo}»:`, String(ev.puntos || 20));
      if (p === null) return;
      puntos = Number(p) || 0;
    } else {
      comentario = prompt(estado === "rechazada" ? "Motivo del rechazo:" : "Motivo de la cancelación:") ?? undefined;
      if (!comentario?.trim()) return;
    }
    const r = await a.ejecutar(() => api(`/admin/eventos/${ev.id}/revision`, { cuerpo: { estado, comentario, puntos } }), estado === "aprobada" ? "Evento publicado en la app" : "Listo");
    if (r) void recargar();
  }

  return (
    <>
      <Cabecera ceja="Programa" titulo="Eventos del Paseo" descripcion="Conciertos, ferias, talleres y lanzamientos. Los eventos aprobados se muestran en la app, en el mapa y Jarvis los menciona cuando alguien pregunta qué hay para hacer.">
        <button className="btn" onClick={() => setF(VACIO)}>Nuevo evento</button>
      </Cabecera>
      <div className="segmentado" style={{ marginBottom: 16 }}>
        <button className={filtro === "proximos" ? "on" : ""} onClick={() => setFiltro("proximos")}>Próximos</button>
        <button className={filtro === "pendiente" ? "on" : ""} onClick={() => setFiltro("pendiente")}>Por aprobar{filtro !== "pendiente" && pendientes ? ` (${pendientes})` : ""}</button>
        <button className={filtro === "todos" ? "on" : ""} onClick={() => setFiltro("todos")}>Todos</button>
      </div>
      <Mensajes error={!f ? a.error : null} exito={!f ? a.exito : null} />
      <Seccion titulo={filtro === "pendiente" ? "Propuestas de comercios" : "Agenda"}>
        {!datos ? <Cargando /> : !lista.length ? <div className="vacio">No hay eventos en esta vista.</div> : (
          <table className="libro">
            <thead><tr><th>Evento</th><th>Cuándo</th><th>Dónde</th><th className="der">Entrada</th><th className="der">Puntos</th><th>Estado</th></tr></thead>
            <tbody>
              {lista.map((ev) => (
                <tr key={ev.id}>
                  <td><b style={{ fontWeight: 500 }}>{ev.titulo}</b><small>{TIPOS_EVENTO[ev.tipo] ?? ev.tipo} · propuesto por {ev.creado_por_nombre ?? "—"}</small></td>
                  <td className="num">{fechaHora(ev.inicio)}<small>hasta {hora(ev.fin)}</small></td>
                  <td>{ev.lugar}<small>{ev.zona ?? ""}</small></td>
                  <td className="der">{ev.precio_bs != null && Number(ev.precio_bs) > 0 ? bs(ev.precio_bs) : "Gratis"}{ev.cupos ? <small>{ev.cupos} cupos</small> : null}</td>
                  <td className="der oro">{ev.puntos}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {ev.estado === "pendiente" ? (
                      <>
                        <button className="btn chico" onClick={() => revisar(ev, "aprobada")}>Aprobar</button>{" "}
                        <button className="btn claro chico" onClick={() => revisar(ev, "rechazada")}>Rechazar</button>
                      </>
                    ) : (
                      <>
                        <span className={`etiqueta ${ESTADO_REVISION[ev.estado][1]}`}>{ESTADO_REVISION[ev.estado][0]}</span>
                        {ev.estado === "aprobada" && new Date(ev.fin) > new Date() && <button className="btn claro chico" style={{ marginLeft: 8 }} onClick={() => revisar(ev, "cancelada")}>Cancelar</button>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Seccion>

      <PanelLateral abierto={!!f} titulo="Nuevo evento" onCerrar={() => setF(null)}>
        {f && (
          <form onSubmit={crear} style={{ display: "grid", gap: 14 }}>
            <label className="campo"><span>Título</span><input required minLength={3} value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></label>
            <label className="campo">
              <span>Tipo</span>
              <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
                {Object.entries(TIPOS_EVENTO).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </label>
            <label className="campo"><span>Descripción</span><textarea rows={3} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></label>
            <div className="fila-campos">
              <label className="campo"><span>Empieza</span><input required type="datetime-local" value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} /></label>
              <label className="campo"><span>Termina</span><input required type="datetime-local" value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} /></label>
            </div>
            <label className="campo">
              <span>Zona</span>
              <select value={f.zonaId} onChange={(e) => setF({ ...f, zonaId: e.target.value })}>
                <option value="">—</option>
                {plano?.zonas.map((z: any) => <option key={z.id} value={z.id}>{z.nombre} · {z.piso}</option>)}
              </select>
            </label>
            <label className="campo">
              <span>Comercio anfitrión (opcional)</span>
              <select value={f.localId} onChange={(e) => setF({ ...f, localId: e.target.value })}>
                <option value="">Ninguno</option>
                {plano?.locales.map((l: any) => <option key={l.id} value={l.id}>{l.nombre} · {l.numero_local}</option>)}
              </select>
            </label>
            <label className="campo"><span>Lugar (texto para el cliente)</span><input value={f.lugar} onChange={(e) => setF({ ...f, lugar: e.target.value })} placeholder="la plaza central del Nivel 1" /></label>
            <div className="fila-campos">
              <label className="campo"><span>Precio (Bs)</span><input type="number" min="0" value={f.precioBs} onChange={(e) => setF({ ...f, precioBs: e.target.value })} placeholder="Gratis" /></label>
              <label className="campo"><span>Cupos</span><input type="number" min="1" value={f.cupos} onChange={(e) => setF({ ...f, cupos: e.target.value })} /></label>
              <label className="campo"><span>Puntos</span><input type="number" min="0" max="1000" value={f.puntos} onChange={(e) => setF({ ...f, puntos: e.target.value })} /></label>
            </div>
            <Mensajes error={a.error} />
            <button className="btn" disabled={a.enviando}>Publicar evento</button>
          </form>
        )}
      </PanelLateral>
    </>
  );
}

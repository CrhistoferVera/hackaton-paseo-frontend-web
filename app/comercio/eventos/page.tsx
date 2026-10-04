"use client";

import { useState } from "react";
import { Cabecera, Cargando, Mensajes, Seccion } from "@/components/marco";
import { api, descargar } from "@/lib/api";
import { ESTADO_REVISION, TIPOS_EVENTO, bs, fechaHora, hora, isoLocal } from "@/lib/formato";
import { useAccion, useDatos } from "@/lib/use-datos";

const VACIO = { titulo: "", descripcion: "", tipo: "degustacion", inicio: "", fin: "", lugar: "", precioBs: "", cupos: "" };

/** El comercio propone eventos (degustaciones, talleres, lanzamientos). Al aprobarse, aparecen en la app y Jarvis los recomienda. */
export default function EventosComercio() {
  const { datos, recargar } = useDatos<any[]>("/local/eventos");
  const a = useAccion();
  const [f, setF] = useState(VACIO);

  async function proponer(e: React.FormEvent) {
    e.preventDefault();
    const cuerpo = {
      titulo: f.titulo,
      descripcion: f.descripcion,
      tipo: f.tipo,
      inicio: isoLocal(f.inicio),
      fin: isoLocal(f.fin),
      lugar: f.lugar || undefined,
      precioBs: f.precioBs === "" ? null : Number(f.precioBs),
      cupos: f.cupos === "" ? null : Number(f.cupos),
    };
    const r = await a.ejecutar(() => api("/local/eventos", { cuerpo }), "Evento enviado. Te avisaremos cuando se publique.");
    if (r) {
      setF(VACIO);
      void recargar();
    }
  }

  async function cancelar(ev: any) {
    if (!confirm(ev.estado === "pendiente" ? `¿Retirar «${ev.titulo}»?` : `¿Cancelar «${ev.titulo}»? Se quitará de la app.`)) return;
    const r = await a.ejecutar(() => api(`/local/eventos/${ev.id}`, { metodo: "DELETE" }), "Listo");
    if (r) void recargar();
  }

  return (
    <>
      <Cabecera
        ceja="Mi negocio"
        titulo="Eventos"
        descripcion="Propón degustaciones, talleres, lanzamientos o shows en tu local. Cuando el Paseo los aprueba, aparecen en la app y Jarvis los recomienda a quienes están cerca."
      />
      <div className="dos-col">
        <form onSubmit={proponer} style={{ display: "grid", gap: 16 }}>
          <label className="campo"><span>Título</span><input required minLength={3} value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Degustación de café de los Yungas" /></label>
          <label className="campo">
            <span>Tipo</span>
            <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
              {Object.entries(TIPOS_EVENTO).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </label>
          <label className="campo"><span>Descripción</span><textarea rows={3} maxLength={600} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></label>
          <div className="fila-campos">
            <label className="campo"><span>Empieza</span><input required type="datetime-local" value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} /></label>
            <label className="campo"><span>Termina</span><input required type="datetime-local" value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} /></label>
          </div>
          <label className="campo"><span>Lugar</span><input value={f.lugar} onChange={(e) => setF({ ...f, lugar: e.target.value })} placeholder="En tu local (por defecto)" /></label>
          <div className="fila-campos">
            <label className="campo"><span>Precio (Bs, vacío = gratis)</span><input type="number" min="0" step="0.5" value={f.precioBs} onChange={(e) => setF({ ...f, precioBs: e.target.value })} /></label>
            <label className="campo"><span>Cupos</span><input type="number" min="1" value={f.cupos} onChange={(e) => setF({ ...f, cupos: e.target.value })} /></label>
          </div>
          <Mensajes error={a.error} exito={a.exito} />
          <button className="btn" disabled={a.enviando}>Enviar para aprobación</button>
        </form>

        <Seccion titulo="Tus eventos">
          {!datos ? <Cargando /> : !datos.length ? <div className="vacio">Aún no propusiste eventos.</div> : (
            <table className="libro">
              <tbody>
                {datos.map((ev) => {
                  const pasado = new Date(ev.fin) < new Date();
                  return (
                    <tr key={ev.id} style={pasado ? { opacity: 0.55 } : undefined}>
                      <td>
                        <b style={{ fontWeight: 500 }}>{ev.titulo}</b>
                        <small>
                          {TIPOS_EVENTO[ev.tipo] ?? ev.tipo} · {fechaHora(ev.inicio)} a {hora(ev.fin)} · {ev.lugar}
                          {ev.precio_bs != null && Number(ev.precio_bs) > 0 ? ` · ${bs(ev.precio_bs)}` : " · Gratis"}
                          {ev.cupos ? ` · ${ev.cupos} cupos` : ""}
                        </small>
                        {ev.puntos > 0 && <small>Los asistentes ganan {ev.puntos} puntos</small>}
                        {ev.comentario && <small>Comentario: {ev.comentario}</small>}
                      </td>
                      <td className="der" style={{ whiteSpace: "nowrap" }}>
                        <span className={`etiqueta ${ESTADO_REVISION[ev.estado][1]}`}>{pasado && ev.estado === "aprobada" ? "Realizado" : ESTADO_REVISION[ev.estado][0]}</span>
                        {!pasado && ev.estado === "aprobada" && (
                          <button className="btn claro chico" style={{ marginLeft: 8 }} title="Imprímelo y ponlo en el evento: quien lo escanea suma los puntos de asistencia" onClick={() => a.ejecutar(() => descargar(`/local/eventos/${ev.id}/qr.pdf`, `qr-${ev.titulo}.pdf`), "QR de asistencia descargado")}>QR de asistencia</button>
                        )}
                        {!pasado && ["pendiente", "aprobada"].includes(ev.estado) && (
                          <button className="btn claro chico" style={{ marginLeft: 8 }} onClick={() => cancelar(ev)}>{ev.estado === "pendiente" ? "Retirar" : "Cancelar"}</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Seccion>
      </div>
    </>
  );
}

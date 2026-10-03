"use client";

import { useState } from "react";
import { Cabecera, Mensajes, Seccion } from "@/components/marco";
import { api } from "@/lib/api";
import { diasAtrasIso, fecha, hoyIso } from "@/lib/formato";
import { useAccion, useDatos } from "@/lib/use-datos";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** HU-L11: promociones para horarios flojos; requieren aprobación del Paseo. */
export default function Promociones() {
  const { datos, recargar } = useDatos<any[]>("/local/promociones");
  const { datos: panel } = useDatos<any>("/local/panel?dias=30");
  const a = useAccion();
  const [f, setF] = useState({ titulo: "", tipo: "puntos_dobles", multiplicador: 2, descripcion: "", diasSemana: [1, 2, 3, 4], horaInicio: "15:00", horaFin: "17:00", inicio: hoyIso(), fin: diasAtrasIso(-30) });

  const flojas = panel?.horas?.length
    ? [...panel.horas].filter((h: any) => h.hora >= 10 && h.hora <= 21).sort((a: any, b: any) => a.compras - b.compras).slice(0, 3).map((h: any) => `${h.hora}:00`)
    : [];

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const r = await a.ejecutar(() => api("/local/promociones", { cuerpo: { ...f, multiplicador: Number(f.multiplicador) } }), "Enviada. El Paseo la revisará y te avisaremos.");
    if (r) void recargar();
  }

  const vencida = (p: any) => String(p.fin).slice(0, 10) < hoyIso();

  async function finalizar(p: any) {
    if (!confirm(p.estado === "aprobada" ? `¿Terminar «${p.titulo}» hoy?` : `¿Retirar «${p.titulo}»?`)) return;
    const r = await a.ejecutar(() => api(`/local/promociones/${p.id}`, { metodo: "DELETE" }), p.estado === "aprobada" ? "La promoción termina hoy" : "Promoción retirada");
    if (r) void recargar();
  }

  const alternar = (d: number) => setF({ ...f, diasSemana: f.diasSemana.includes(d) ? f.diasSemana.filter((x) => x !== d) : [...f.diasSemana, d].sort() });

  return (
    <>
      <Cabecera ceja="Mi negocio" titulo="Promociones" descripcion="Atrae clientes en tus horas flojas. Cada promoción se publica cuando la administración del Paseo la aprueba." />
      <div className="dos-col">
        <form onSubmit={crear} style={{ display: "grid", gap: 16 }}>
          {flojas.length > 0 && <div className="aviso">Tus horas con menos compras en los últimos 30 días: <b>{flojas.join(", ")}</b>.</div>}
          <label className="campo"><span>Título</span><input required value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Tarde de café ×2" /></label>
          <div className="campo">
            <span>Tipo</span>
            <div className="segmentado">
              <button type="button" className={f.tipo === "puntos_dobles" ? "on" : ""} onClick={() => setF({ ...f, tipo: "puntos_dobles" })}>Puntos multiplicados</button>
              <button type="button" className={f.tipo === "cupon" ? "on" : ""} onClick={() => setF({ ...f, tipo: "cupon" })}>Cupón</button>
            </div>
          </div>
          {f.tipo === "puntos_dobles" && (
            <label className="campo"><span>Multiplicador</span><input type="number" min="1.5" max="5" step="0.5" value={f.multiplicador} onChange={(e) => setF({ ...f, multiplicador: Number(e.target.value) })} /></label>
          )}
          <label className="campo"><span>Descripción para el cliente</span><textarea rows={2} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></label>
          <div className="campo">
            <span>Días</span>
            <div className="segmentado">
              {DIAS.map((d, i) => <button type="button" key={d} className={f.diasSemana.includes(i) ? "on" : ""} onClick={() => alternar(i)}>{d}</button>)}
            </div>
          </div>
          <div className="fila-campos">
            <label className="campo"><span>Desde la hora</span><input type="time" value={f.horaInicio} onChange={(e) => setF({ ...f, horaInicio: e.target.value })} /></label>
            <label className="campo"><span>Hasta la hora</span><input type="time" value={f.horaFin} onChange={(e) => setF({ ...f, horaFin: e.target.value })} /></label>
          </div>
          <div className="fila-campos">
            <label className="campo"><span>Inicio</span><input type="date" value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} /></label>
            <label className="campo"><span>Fin</span><input type="date" value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} /></label>
          </div>
          <Mensajes error={a.error} exito={a.exito} />
          <button className="btn" disabled={a.enviando || !f.diasSemana.length}>Enviar para aprobación</button>
        </form>
        <Seccion titulo="Tus promociones">
          {!datos?.length ? <div className="vacio">Aún no creaste promociones.</div> : (
            <table className="libro">
              <tbody>
                {datos.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <b style={{ fontWeight: 500 }}>{p.titulo}</b>
                      <small>
                        {p.tipo === "puntos_dobles" ? `Puntos ×${Number(p.multiplicador)}` : "Cupón"} · {p.dias_semana.map((d: number) => DIAS[d]).join(" ")} · {p.hora_inicio.slice(0, 5)}–{p.hora_fin.slice(0, 5)} · {fecha(p.inicio)} a {fecha(p.fin)}
                      </small>
                      {p.comentario && <small>Comentario: {p.comentario}</small>}
                    </td>
                    <td className="der" style={{ whiteSpace: "nowrap" }}>
                      <span className={`etiqueta ${p.estado === "aprobada" ? "exito" : p.estado === "rechazada" ? "alerta" : "tenue"}`}>{vencida(p) ? "terminada" : p.estado}</span>
                      {!vencida(p) && p.estado !== "rechazada" && (
                        <button className="btn claro chico" style={{ marginLeft: 8 }} onClick={() => finalizar(p)}>{p.estado === "aprobada" ? "Terminar hoy" : "Retirar"}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Seccion>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { Cabecera, Cargando, Mensajes, Seccion } from "@/components/marco";
import { api } from "@/lib/api";
import { bs, fechaHora } from "@/lib/formato";
import { useTiempoReal } from "@/lib/tiempo-real";
import { useAccion, useDatos } from "@/lib/use-datos";

const ESTADO: Record<string, [string, string]> = {
  pendiente: ["Por aprobar", "tenue"],
  lanzada: ["Lanzado", "exito"],
  rechazada: ["Rechazado", "alerta"],
  cancelada: ["Cancelado", "tenue"],
};

/**
 * El comercio pide un Drop: un precio especial por tiempo limitado que los clientes reclaman desde la app
 * estando en el Paseo. La administración lo aprueba y lo lanza; Jarvis avisa por voz a quienes están cerca.
 */
export default function DropsComercio() {
  const { datos, recargar } = useDatos<any[]>("/local/drops");
  const { datos: productos } = useDatos<any[]>("/local/productos");
  const a = useAccion();
  const [f, setF] = useState({ productoId: "", precioEspecial: "", mensaje: "", fechaDeseada: "", minutos: "60", maxReclamos: "40" });
  useTiempoReal({ drop: () => void recargar() });

  const producto = productos?.find((p) => p.id === f.productoId);
  const descuento = producto && f.precioEspecial ? Math.round((1 - Number(f.precioEspecial) / Number(producto.precio_bs)) * 100) : null;

  async function solicitar(e: React.FormEvent) {
    e.preventDefault();
    const cuerpo = {
      productoId: f.productoId,
      precioEspecial: Number(f.precioEspecial),
      mensaje: f.mensaje,
      fechaDeseada: f.fechaDeseada ? new Date(f.fechaDeseada).toISOString() : null,
      minutos: Number(f.minutos),
      maxReclamos: Number(f.maxReclamos),
    };
    const r = await a.ejecutar(() => api("/local/drops", { cuerpo }), "Solicitud enviada. La administración la revisará y te avisaremos cuando se lance.");
    if (r) {
      setF({ ...f, productoId: "", precioEspecial: "", mensaje: "" });
      void recargar();
    }
  }

  async function cancelar(id: string) {
    if (!confirm("¿Cancelar esta solicitud?")) return;
    const r = await a.ejecutar(() => api(`/local/drops/${id}`, { metodo: "DELETE" }), "Solicitud cancelada");
    if (r) void recargar();
  }

  return (
    <>
      <Cabecera
        ceja="Mi negocio"
        titulo="Drops"
        descripcion="Un Drop es una oferta relámpago: tu producto a precio especial, solo por un rato y con unidades limitadas. Los clientes lo ven en la app y en el mapa, sobre tu local, y lo reclaman estando en el Paseo. Jarvis avisa por voz a los que están cerca."
      />
      <div className="dos-col">
        <form onSubmit={solicitar} style={{ display: "grid", gap: 16 }}>
          <label className="campo">
            <span>Producto</span>
            <select required value={f.productoId} onChange={(e) => setF({ ...f, productoId: e.target.value })}>
              <option value="">Elige…</option>
              {productos?.filter((p) => p.activo).map((p) => <option key={p.id} value={p.id}>{p.nombre} · {bs(p.precio_bs)} · stock {p.stock}</option>)}
            </select>
          </label>
          <div className="fila-campos">
            <label className="campo">
              <span>Precio del Drop (Bs)</span>
              <input required type="number" min="1" step="0.5" value={f.precioEspecial} onChange={(e) => setF({ ...f, precioEspecial: e.target.value })} />
            </label>
            <label className="campo">
              <span>Descuento</span>
              <input readOnly value={descuento === null ? "—" : `${descuento} %`} />
            </label>
          </div>
          <label className="campo">
            <span>Mensaje para el cliente</span>
            <input required maxLength={140} value={f.mensaje} onChange={(e) => setF({ ...f, mensaje: e.target.value })} placeholder="¡Media docena a precio de locura!" />
          </label>
          <label className="campo"><span>Cuándo te gustaría (opcional)</span><input type="datetime-local" value={f.fechaDeseada} onChange={(e) => setF({ ...f, fechaDeseada: e.target.value })} /></label>
          <div className="fila-campos">
            <label className="campo"><span>Duración (min)</span><input type="number" min="15" max="1440" value={f.minutos} onChange={(e) => setF({ ...f, minutos: e.target.value })} /></label>
            <label className="campo"><span>Unidades</span><input type="number" min="1" max="1000" value={f.maxReclamos} onChange={(e) => setF({ ...f, maxReclamos: e.target.value })} /></label>
          </div>
          <Mensajes error={a.error} exito={a.exito} />
          <button className="btn" disabled={a.enviando}>Solicitar Drop</button>
        </form>

        <Seccion titulo="Tus solicitudes">
          {!datos ? <Cargando /> : !datos.length ? <div className="vacio">Aún no pediste Drops.</div> : (
            <table className="libro">
              <tbody>
                {datos.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <b style={{ fontWeight: 500 }}>{s.producto}</b>
                      <small>
                        {bs(s.precio_especial)} en vez de {bs(s.precio_bs)} · {s.zona ?? "zona del local"} · {s.minutos} min · {s.max_reclamos} unidades
                      </small>
                      <small>{s.fecha_deseada ? `Pedido para ${fechaHora(s.fecha_deseada)}` : `Enviado ${fechaHora(s.creado_en)}`}{s.estado === "lanzada" ? ` · ${s.reclamos} cajas abiertas` : ""}</small>
                      {s.comentario && <small>Comentario: {s.comentario}</small>}
                    </td>
                    <td className="der" style={{ whiteSpace: "nowrap" }}>
                      <span className={`etiqueta ${ESTADO[s.estado][1]}`}>{ESTADO[s.estado][0]}</span>
                      {s.estado === "pendiente" && <button className="btn claro chico" style={{ marginLeft: 8 }} onClick={() => cancelar(s.id)}>Cancelar</button>}
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

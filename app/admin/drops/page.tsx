"use client";

import { Cabecera, Cargando, Mensajes, Seccion } from "@/components/marco";
import { api } from "@/lib/api";
import { bs, fechaHora } from "@/lib/formato";
import { useTiempoReal } from "@/lib/tiempo-real";
import { useAccion, useDatos } from "@/lib/use-datos";

/** Experiencias AR: carteles (hitos) por zona y Drops espaciales lanzados desde el gemelo digital. */
export default function Drops() {
  const { datos: drops, recargar } = useDatos<any[]>("/admin/drops");
  const { datos: hitos } = useDatos<any[]>("/admin/hitos");
  const { datos: solicitudes, recargar: recargarSol } = useDatos<any[]>("/admin/drops/solicitudes");
  const a = useAccion();
  useTiempoReal({ drop: () => void recargar() });

  async function lanzar(s: any) {
    if (!confirm(`¿Lanzar ahora el Drop de ${s.producto} (${s.local}) a ${bs(s.precio_especial)} por ${s.minutos} minutos?`)) return;
    const r = await a.ejecutar(() => api(`/admin/drops/solicitudes/${s.id}/lanzar`, { cuerpo: {} }), (d: any) => `Drop lanzado: se avisó a ${d.avisados} clientes en el Paseo`);
    if (r) {
      void recargar();
      void recargarSol();
    }
  }

  async function rechazar(s: any) {
    const comentario = prompt(`Motivo del rechazo para ${s.local}:`);
    if (!comentario?.trim()) return;
    const r = await a.ejecutar(() => api(`/admin/drops/solicitudes/${s.id}/rechazar`, { cuerpo: { comentario } }), "Solicitud rechazada");
    if (r) void recargarSol();
  }

  const pendientes = solicitudes?.filter((x) => x.estado === "pendiente") ?? [];
  return (
    <>
      <Cabecera ceja="Experiencias AR" titulo="Drops y hitos" descripcion="Cada zona tiene un cartel con un QR de alto contraste. La app lo reconoce con la cámara, verifica la geocerca y muestra la moneda o la caja del Drop. Los Drops se lanzan desde el gemelo digital o al aprobar la solicitud de un comercio.">
        <a className="btn" href="/admin/centro">Lanzar desde el gemelo</a>
      </Cabecera>
      <Mensajes error={a.error} exito={a.exito} />
      <Seccion titulo={`Solicitudes de comercios${pendientes.length ? ` · ${pendientes.length} por aprobar` : ""}`}>
        {!solicitudes ? <Cargando /> : !solicitudes.length ? <div className="vacio">Ningún comercio pidió un Drop todavía.</div> : (
          <table className="libro">
            <thead><tr><th>Comercio</th><th>Producto</th><th className="der">Precio del Drop</th><th>Zona y duración</th><th>Pedido para</th><th>Estado</th></tr></thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id}>
                  <td>{s.local}<small>{s.mensaje}</small></td>
                  <td>{s.producto}<small>Normal {bs(s.precio_bs)} · stock {s.stock}</small></td>
                  <td className="der oro">{bs(s.precio_especial)}<small>−{Math.round((1 - Number(s.precio_especial) / Number(s.precio_bs)) * 100)} %</small></td>
                  <td>{s.zona ?? "—"} · {s.piso}<small>{s.minutos} min · {s.max_reclamos} unidades</small></td>
                  <td className="num">{s.fecha_deseada ? fechaHora(s.fecha_deseada) : "Cuando se apruebe"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {s.estado === "pendiente" ? (
                      <>
                        <button className="btn chico" onClick={() => lanzar(s)} disabled={a.enviando}>Aprobar y lanzar</button>{" "}
                        <button className="btn claro chico" onClick={() => rechazar(s)} disabled={a.enviando}>Rechazar</button>
                      </>
                    ) : (
                      <span className={`etiqueta ${s.estado === "lanzada" ? "exito" : s.estado === "rechazada" ? "alerta" : "tenue"}`}>{s.estado}</span>
                    )}
                    {s.comentario && <small>{s.comentario}</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Seccion>
      <Seccion titulo="Drops">
        {!drops ? <Cargando /> : !drops.length ? <div className="vacio">Todavía no se lanzó ningún Drop.</div> : (
          <table className="libro">
            <thead><tr><th>Zona</th><th>Producto</th><th className="der">Precio especial</th><th>Vigencia</th><th className="der">Cajas abiertas</th><th className="der">Compras</th><th>Estado</th></tr></thead>
            <tbody>
              {drops.map((d) => (
                <tr key={d.id}>
                  <td>{d.zona} · {d.piso}<small>{d.mensaje}</small></td>
                  <td>{d.producto}<small>Normal {bs(d.precio_bs)}</small></td>
                  <td className="der oro">{bs(d.precio_especial)}</td>
                  <td className="num">{fechaHora(d.inicio)} – {fechaHora(d.fin)}</td>
                  <td className="der">{d.reclamos} / {d.max_reclamos}</td>
                  <td className="der">{d.compras}</td>
                  <td>{d.activo ? <span className="etiqueta oro vivo">Activo</span> : <span className="etiqueta tenue">Terminado</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Seccion>
      <Seccion titulo="Carteles de hitos">
        {!hitos ? <Cargando /> : (
          <table className="libro">
            <thead><tr><th>Cartel</th><th>Zona</th><th>Código del QR</th><th className="der">Puntos por moneda</th><th className="der">Monedas reclamadas</th></tr></thead>
            <tbody>
              {hitos.map((h) => (
                <tr key={h.id}>
                  <td>{h.nombre}</td>
                  <td>{h.zona} · {h.piso}</td>
                  <td className="dato">PPH:{h.codigo}</td>
                  <td className="der">{h.puntos}</td>
                  <td className="der">{h.reclamos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Seccion>
    </>
  );
}

"use client";

import { Cabecera, Cargando, Seccion } from "@/components/marco";
import { bs, fechaHora } from "@/lib/formato";
import { useTiempoReal } from "@/lib/tiempo-real";
import { useDatos } from "@/lib/use-datos";

/** Experiencias AR: carteles (hitos) por zona y Drops espaciales lanzados desde el gemelo digital. */
export default function Drops() {
  const { datos: drops, recargar } = useDatos<any[]>("/admin/drops");
  const { datos: hitos } = useDatos<any[]>("/admin/hitos");
  useTiempoReal({ drop: () => void recargar() });
  return (
    <>
      <Cabecera ceja="Experiencias AR" titulo="Drops y hitos" descripcion="Cada zona tiene un cartel con un QR de alto contraste. La app lo reconoce con la cámara, verifica la geocerca y muestra la moneda o la caja del Drop. Los Drops se lanzan desde el gemelo digital.">
        <a className="btn" href="/admin/centro">Lanzar desde el gemelo</a>
      </Cabecera>
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

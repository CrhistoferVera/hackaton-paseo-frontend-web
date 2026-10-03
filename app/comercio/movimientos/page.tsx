"use client";

import { useState } from "react";
import { Cabecera, Cargando, Indicador, Mensajes, Seccion } from "@/components/marco";
import { descargar } from "@/lib/api";
import { bs, diasAtrasIso, entero, fechaHora, hoyIso, pts } from "@/lib/formato";
import { useAccion, useDatos } from "@/lib/use-datos";

/** HU-L06: compras, puntos emitidos y canjes por fecha, exportable a CSV. */
export default function Movimientos() {
  const [desde, setDesde] = useState(diasAtrasIso(6));
  const [hasta, setHasta] = useState(hoyIso());
  const q = `desde=${desde}&hasta=${hasta}`;
  const { datos, cargando, error } = useDatos<any>(`/local/movimientos?${q}`);
  const csv = useAccion();

  return (
    <>
      <Cabecera ceja="Resultados" titulo="Movimientos" descripcion="Compras registradas, puntos emitidos y canjes validados en tu local.">
        <button className="btn claro" onClick={() => csv.ejecutar(() => descargar(`/local/movimientos.csv?${q}`, `movimientos-${desde}-${hasta}.csv`))}>
          Exportar CSV
        </button>
      </Cabecera>
      <div className="fila-campos" style={{ marginBottom: 20, maxWidth: 720 }}>
        <label className="campo"><span>Desde</span><input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
        <label className="campo"><span>Hasta</span><input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
      </div>
      <Mensajes error={error ?? csv.error} />
      {cargando && !datos ? (
        <Cargando />
      ) : datos ? (
        <>
          <div className="indicadores">
            <Indicador etiqueta="Compras" valor={entero(datos.totales.compras)} />
            <Indicador etiqueta="Ventas registradas" valor={bs(datos.totales.ventasBs, 0)} />
            <Indicador etiqueta="Puntos emitidos" valor={entero(datos.totales.puntosEmitidos)} oro />
            <Indicador etiqueta="Canjes validados" valor={entero(datos.totales.canjes)} detalle={pts(datos.totales.puntosCanjeados)} />
          </div>
          <Seccion titulo="Compras">
            {!datos.compras.length ? (
              <div className="vacio">Sin compras en el período.</div>
            ) : (
              <div className="tabla-envoltura">
                <table className="libro">
                  <thead>
                    <tr><th>Fecha</th><th>Cliente</th><th>Categoría</th><th>Factura</th><th className="der">Monto</th><th className="der">Puntos</th><th>Origen</th></tr>
                  </thead>
                  <tbody>
                    {datos.compras.map((c: any) => (
                      <tr key={c.id} style={c.estado === "anulada" ? { opacity: 0.5, textDecoration: "line-through" } : undefined}>
                        <td className="num">{fechaHora(c.creado_en)}</td>
                        <td>{c.cliente}</td>
                        <td>{c.categoria}</td>
                        <td className="dato">{c.nro_factura ?? "—"}</td>
                        <td className="der">{bs(c.monto_bs)}</td>
                        <td className="der oro">{c.puntos}</td>
                        <td>
                          <span className="etiqueta tenue">{c.origen}</span> {c.offline && <span className="etiqueta oro">sin red</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Seccion>
          <Seccion titulo="Canjes validados">
            {!datos.canjes.length ? (
              <div className="vacio">Sin canjes en el período.</div>
            ) : (
              <table className="libro">
                <thead><tr><th>Fecha</th><th>Recompensa</th><th className="der">Puntos</th></tr></thead>
                <tbody>
                  {datos.canjes.map((c: any) => (
                    <tr key={c.id}>
                      <td className="num">{fechaHora(c.creado_en)}</td>
                      <td>{c.recompensa}</td>
                      <td className="der">−{c.costo_puntos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Seccion>
        </>
      ) : null}
    </>
  );
}

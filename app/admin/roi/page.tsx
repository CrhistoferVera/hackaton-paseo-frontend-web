"use client";

import { Cabecera, Cargando, Seccion } from "@/components/marco";
import { bs, entero, fecha, pct } from "@/lib/formato";
import { useDatos } from "@/lib/use-datos";

const signo = (n: number | null) => (n === null || n === undefined ? "—" : `${n > 0 ? "+" : ""}${pct(n)}`);

/** HU-A16: puntos invertidos contra ventas, comparado con el período anterior y con quienes no fueron alcanzados. */
export default function Roi() {
  const { datos } = useDatos<any>("/admin/inteligencia/roi");
  return (
    <>
      <Cabecera ceja="¿Qué incentivo vale la pena repetir?" titulo="Retorno de promociones y misiones" descripcion="El grupo de control es el resto del Paseo en las mismas fechas: así se descuenta lo que habría crecido igual." />
      {!datos ? <Cargando /> : (
        <>
          <Seccion titulo="Promociones de puntos multiplicados">
            {!datos.promociones.length ? <div className="vacio">No hay promociones con datos.</div> : (
              <div className="tabla-envoltura">
                <table className="libro">
                  <thead><tr><th>Promoción</th><th className="der">Puntos invertidos</th><th className="der">Costo</th><th className="der">Ventas</th><th className="der">vs. período previo</th><th className="der">Control</th><th className="der">Lift</th><th className="der">Ventas incrementales</th><th className="der">Retorno</th></tr></thead>
                  <tbody>
                    {datos.promociones.map((p: any) => (
                      <tr key={p.id}>
                        <td>{p.titulo}<small>{p.local} · ×{Number(p.multiplicador)} · {fecha(p.inicio)} a {fecha(p.fin)}{p.segmento ? ` · ${p.segmento}` : ""} · {entero(p.clientes_alcanzados)} clientes</small></td>
                        <td className="der oro">{entero(p.puntos_invertidos)}</td>
                        <td className="der">{bs(p.costoBs)}</td>
                        <td className="der">{bs(p.ventas, 0)}</td>
                        <td className="der">{signo(p.crecimientoLocal)}</td>
                        <td className="der muted">{signo(p.crecimientoControl)}</td>
                        <td className="der"><b>{p.liftPp > 0 ? "+" : ""}{p.liftPp} pp</b></td>
                        <td className="der">{bs(p.ventasIncrementales, 0)}</td>
                        <td className="der">{p.retorno === null ? "—" : <span className={`etiqueta ${p.retorno >= 1 ? "exito" : "alerta"}`}>{p.retorno}×</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Seccion>
          <Seccion titulo="Misiones">
            <table className="libro">
              <thead><tr><th>Misión</th><th className="der">Completaron</th><th className="der">Puntos invertidos</th><th className="der">Costo</th><th className="der">Ventas de quienes la cumplieron</th><th className="der">vs. período previo</th></tr></thead>
              <tbody>
                {datos.misiones.map((m: any) => (
                  <tr key={m.nombre}>
                    <td>{m.nombre}<small>{fecha(m.desde)} a {fecha(m.hasta)}</small></td>
                    <td className="der">{entero(m.completaron)}</td>
                    <td className="der oro">{entero(m.puntos_invertidos)}</td>
                    <td className="der">{bs(m.costoBs)}</td>
                    <td className="der">{bs(m.ventas_completadores, 0)}</td>
                    <td className="der">{signo(m.crecimientoCompletadores)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Seccion>
        </>
      )}
    </>
  );
}

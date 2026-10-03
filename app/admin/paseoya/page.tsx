"use client";

import { Cabecera, Cargando, Indicador, Seccion } from "@/components/marco";
import { bs, entero, ESTADO_PEDIDO, fechaHora } from "@/lib/formato";
import { useDatos } from "@/lib/use-datos";

/** HU-Y18: pedidos por estado y tráfico inducido. */
export default function PaseoYaAdmin() {
  const { datos: d } = useDatos<any>("/admin/inteligencia/paseoya?dias=30");
  return (
    <>
      <Cabecera ceja="¿PaseoYa trae gente al Paseo?" titulo="PaseoYa" descripcion="Cada retiro es una visita con hora de llegada conocida. El tráfico inducido mide qué más compró esa persona mientras estaba aquí. Últimos 30 días." />
      {!d ? <Cargando /> : (
        <>
          <div className="indicadores">
            <Indicador etiqueta="Tráfico inducido" valor={`${d.trafico.porcentaje} %`} detalle={`${entero(d.trafico.con_compra_adicional)} de ${entero(d.trafico.retiros)} retiros con compra en otro local`} oro />
            <Indicador etiqueta="Monto adicional promedio" valor={bs(d.trafico.monto_adicional_promedio, 0)} detalle={`${entero(d.trafico.compras_adicionales)} compras adicionales`} />
            {d.estados.map((e: any) => <Indicador key={e.estado} etiqueta={ESTADO_PEDIDO[e.estado]} valor={entero(e.subpedidos)} detalle={bs(e.total, 0)} />)}
          </div>
          <div className="dos-col">
            <Seccion titulo="Por local">
              <table className="libro">
                <thead><tr><th>Local</th><th className="der">Sub-pedidos</th><th className="der">Entregados</th><th className="der">Ventas</th></tr></thead>
                <tbody>
                  {d.locales.map((l: any) => <tr key={l.nombre}><td>{l.nombre}</td><td className="der">{l.subpedidos}</td><td className="der">{l.entregados}</td><td className="der">{bs(l.ventas ?? 0, 0)}</td></tr>)}
                </tbody>
              </table>
            </Seccion>
            <Seccion titulo="Pedidos recientes">
              <table className="libro">
                <tbody>
                  {d.recientes.map((p: any) => (
                    <tr key={p.codigo}>
                      <td className="dato">{p.codigo}<small>{fechaHora(p.creado_en)}</small></td>
                      <td style={{ fontSize: 13 }}>{p.detalle}</td>
                      <td className="der">{bs(p.total_bs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Seccion>
          </div>
        </>
      )}
    </>
  );
}

"use client";

import { Linea } from "@/components/graficos";
import { Cabecera, Cargando, Indicador, Seccion } from "@/components/marco";
import { bs, entero } from "@/lib/formato";
import { useDatos } from "@/lib/use-datos";

const TIPO: Record<string, string> = {
  compra: "Compras", bono: "Bonos de bienvenida", visita: "Visitas diarias", descubrimiento: "Descubrimiento", mision: "Misiones",
  canje: "Canjes", parqueo: "Parqueo", paseoya: "Retiros PaseoYa", referido: "Referidos", hito: "Monedas AR", factura: "Facturas SIAT",
  anulacion: "Anulaciones", vencimiento: "Vencimientos", drop: "Drops", transferencia: "Transferencias",
};

/** HU-A20: puntos emitidos, canjeados, vencidos y pendientes, convertidos a Bs. */
export default function Economia() {
  const { datos: e } = useDatos<any>("/admin/economia");
  return (
    <>
      <Cabecera ceja="¿Cuánto debo en recompensas?" titulo="Economía del programa" descripcion={e ? `Valor de canje vigente: ${bs(e.valorPuntoBs, 2)} por punto.` : undefined} />
      {!e ? <Cargando /> : (
        <>
          <div className="indicadores">
            <Indicador etiqueta="Emitidos" valor={entero(e.emitidos)} detalle={bs(e.enBs.emitidos, 0)} />
            <Indicador etiqueta="Canjeados" valor={entero(e.canjeados)} detalle={bs(e.enBs.canjeados, 0)} />
            <Indicador etiqueta="Vencidos" valor={entero(e.vencidos)} detalle={bs(e.enBs.vencidos, 0)} />
            <Indicador etiqueta="Pendientes por pagar" valor={entero(e.pendientes)} detalle={bs(e.enBs.pendientes, 0)} oro />
          </div>
          <div className="dos-col">
            <Seccion titulo="Evolución mensual">
              <Linea datos={e.mensual} x="mes" series={[{ clave: "emitidos", color: "#16140f", nombre: "Emitidos" }, { clave: "canjeados", color: "#c99a3a", nombre: "Canjeados" }, { clave: "vencidos", color: "#a8281f", nombre: "Vencidos" }]} formato={(v) => entero(v)} />
            </Seccion>
            <Seccion titulo="Por tipo de movimiento">
              <table className="libro">
                <thead><tr><th>Tipo</th><th className="der">Movimientos</th><th className="der">Puntos</th><th className="der">En Bs</th></tr></thead>
                <tbody>
                  {e.porTipo.map((t: any) => (
                    <tr key={t.tipo}>
                      <td>{TIPO[t.tipo] ?? t.tipo}</td>
                      <td className="der">{entero(t.movimientos)}</td>
                      <td className={`der ${t.puntos > 0 ? "oro" : ""}`}>{entero(t.puntos)}</td>
                      <td className="der">{bs(t.puntos * e.valorPuntoBs, 0)}</td>
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

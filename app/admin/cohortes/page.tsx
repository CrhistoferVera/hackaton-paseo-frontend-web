"use client";

import { Cabecera, Cargando } from "@/components/marco";
import { entero } from "@/lib/formato";
import { useDatos } from "@/lib/use-datos";

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** HU-A19: porcentaje de clientes registrados cada mes que siguen visitando en los meses siguientes. */
export default function Cohortes() {
  const { datos } = useDatos<any[]>("/admin/inteligencia/cohortes?meses=6");
  return (
    <>
      <Cabecera ceja="¿El programa realmente fideliza?" titulo="Retención por cohortes" descripcion="Cada fila es el mes de registro. Mes 0 es el mismo mes; una visita o una compra cuentan como actividad." />
      {!datos ? <Cargando /> : (
        <div className="tabla-envoltura">
          <table className="libro">
            <thead>
              <tr><th>Cohorte</th><th className="der">Clientes</th>{Array.from({ length: 6 }, (_, i) => <th key={i} className="der">Mes {i}</th>)}</tr>
            </thead>
            <tbody>
              {datos.map((c) => {
                const [a, m] = c.cohorte.split("-");
                return (
                  <tr key={c.cohorte}>
                    <td>{MES[Number(m) - 1]} {a}</td>
                    <td className="der">{entero(c.tamano)}</td>
                    {c.retencion.map((v: number | null, i: number) => (
                      <td key={i} className="der" style={{ background: v === null ? "transparent" : `rgba(142,106,30,${0.08 + (v / 100) * 0.5})` }}>{v === null ? "" : `${Math.round(v)} %`}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

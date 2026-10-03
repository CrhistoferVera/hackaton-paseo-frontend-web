"use client";

import { Barras } from "@/components/graficos";
import { Cabecera, Cargando } from "@/components/marco";
import { fecha } from "@/lib/formato";
import { useDatos } from "@/lib/use-datos";

/** HU-A13: lo que la gente busca y no encuentra, en la app, Jarvis y PaseoYa. */
export default function Demanda() {
  const { datos } = useDatos<any[]>("/admin/inteligencia/demanda?dias=90");
  return (
    <>
      <Cabecera ceja="¿Qué tiendas nuevas debería traer?" titulo="Demanda insatisfecha" descripcion="Búsquedas sin ningún resultado en los últimos 90 días, por canal." />
      {!datos ? <Cargando /> : !datos.length ? <div className="vacio">Todavía no hay búsquedas sin resultado.</div> : (
        <div className="dos-col">
          <Barras datos={datos.slice(0, 12)} x="termino" y="veces" alto={340} color="#8e6a1e" />
          <table className="libro">
            <thead><tr><th>Búsqueda</th><th className="der">Veces</th><th className="der">App</th><th className="der">Jarvis</th><th className="der">PaseoYa</th><th className="der">Última</th></tr></thead>
            <tbody>
              {datos.map((d) => (
                <tr key={d.termino}>
                  <td>«{d.termino}»</td>
                  <td className="der"><b>{d.veces}</b></td>
                  <td className="der">{d.app}</td>
                  <td className="der">{d.jarvis}</td>
                  <td className="der">{d.paseoya}</td>
                  <td className="der">{fecha(d.ultima)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

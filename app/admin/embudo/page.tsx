"use client";

import { Cabecera, Cargando } from "@/components/marco";
import { bs, entero, pct } from "@/lib/formato";
import { useDatos } from "@/lib/use-datos";

const ROL: Record<string, string> = { imán: "etiqueta llena", dependiente: "etiqueta tenue", mixto: "etiqueta", "sin datos": "etiqueta tenue" };

/** HU-A12: check-ins contra compras y clasificación de locales en imanes y dependientes. */
export default function Embudo() {
  const { datos } = useDatos<any[]>("/admin/inteligencia/embudo?dias=30");
  const imanes = datos?.filter((d) => d.rol === "imán") ?? [];
  const dependientes = datos?.filter((d) => d.rol === "dependiente") ?? [];
  return (
    <>
      <Cabecera ceja="¿Qué inquilinos aportan tráfico?" titulo="Imanes y dependientes" descripcion="Un imán es la primera parada del día de muchos clientes. Un dependiente recibe visitas que ya estaban en el Paseo por otro local. Últimos 30 días." />
      {!datos ? <Cargando /> : (
        <>
          <p style={{ marginTop: 0 }}>
            <b>{imanes.length}</b> imanes ({imanes.slice(0, 3).map((x) => x.nombre).join(", ")}) y <b>{dependientes.length}</b> dependientes. Úsalo en la negociación de alquileres: los imanes traen tráfico que aprovechan los demás.
          </p>
          <div className="tabla-envoltura">
            <table className="libro">
              <thead>
                <tr><th>Local</th><th>Rol</th><th className="der">Primera parada</th><th className="der">Check-ins QR</th><th className="der">Con compra</th><th className="der">Conversión</th><th className="der">Compras</th><th className="der">Clientes</th><th className="der">Ventas</th></tr>
              </thead>
              <tbody>
                {datos.map((d) => (
                  <tr key={d.id}>
                    <td>{d.nombre}<small>{d.categoria} · {d.piso} · {d.numero_local}</small></td>
                    <td><span className={ROL[d.rol]}>{d.rol}</span></td>
                    <td className="der">{pct(d.primera_parada_pct, 0)}</td>
                    <td className="der">{entero(d.checkins)}</td>
                    <td className="der">{entero(d.checkins_con_compra)}</td>
                    <td className="der">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                        <span>{pct(d.conversion, 0)}</span>
                        <span className="barra" style={{ width: 60, display: "inline-block" }}><i style={{ width: `${d.conversion ?? 0}%` }} /></span>
                      </div>
                    </td>
                    <td className="der">{entero(d.compras)}</td>
                    <td className="der">{entero(d.clientes)}</td>
                    <td className="der">{bs(d.ventas, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { Cabecera, Cargando } from "@/components/marco";
import { colorCalor } from "@/components/plano";
import { useDatos } from "@/lib/use-datos";

/** HU-A11: de los clientes que compran en A, qué porcentaje compra en B (mismo mes o misma visita). */
export default function Afinidad() {
  const [modo, setModo] = useState<"mes" | "visita">("mes");
  const { datos } = useDatos<any>(`/admin/inteligencia/afinidad?modo=${modo}&top=12`);
  const max = Math.max(1, ...((datos?.matriz ?? []).flat().filter((x: any) => x !== null) as number[]));
  const pares: { a: string; b: string; v: number }[] = [];
  datos?.matriz?.forEach((fila: (number | null)[], i: number) => fila.forEach((v, j) => v !== null && i < j && pares.push({ a: datos.locales[i].nombre, b: datos.locales[j].nombre, v: Math.max(v, datos.matriz[j][i] ?? 0) })));
  pares.sort((x, y) => y.v - x.v);

  return (
    <>
      <Cabecera ceja="¿Qué locales conviene ubicar juntos o promocionar en conjunto?" titulo="Cruce de compras" descripcion={datos?.descripcion}>
        <div className="segmentado">
          <button className={modo === "mes" ? "on" : ""} onClick={() => setModo("mes")}>Mismo mes</button>
          <button className={modo === "visita" ? "on" : ""} onClick={() => setModo("visita")}>Misma visita</button>
        </div>
      </Cabecera>
      {!datos ? <Cargando /> : (
        <>
          {pares.length > 0 && <p style={{ marginTop: 0 }}>Pares más fuertes: {pares.slice(0, 3).map((p) => `${p.a} + ${p.b} (${p.v} %)`).join(" · ")}.</p>}
          <div className="tabla-envoltura">
            <table style={{ borderCollapse: "separate", borderSpacing: 2, fontSize: 12 }}>
              <thead>
                <tr>
                  <th className="senal muted" style={{ textAlign: "left", fontSize: 9 }}>A ↓ · B →</th>
                  {datos.locales.map((l: any) => (
                    <th key={l.id} style={{ height: 120, verticalAlign: "bottom", padding: 0 }}>
                      <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontWeight: 400, fontSize: 12, whiteSpace: "nowrap" }}>{l.nombre}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datos.locales.map((la: any, i: number) => (
                  <tr key={la.id}>
                    <td style={{ paddingRight: 10, whiteSpace: "nowrap" }}>{la.nombre} <span className="muted" style={{ fontSize: 11 }}>{la.categoria}</span></td>
                    {datos.matriz[i].map((v: number | null, j: number) => (
                      <td key={j} title={v === null ? (i === j ? "" : "Menos de 5 clientes en común (oculto)") : `${v} % de los clientes de ${la.nombre} también compró en ${datos.locales[j].nombre}`}
                        style={{ width: 44, height: 32, textAlign: "center", fontVariantNumeric: "tabular-nums", background: i === j ? "var(--tinta)" : v === null ? "var(--veladura)" : colorCalor(v / max), opacity: v === null ? 1 : 0.3 + 0.7 * (v / max), color: v !== null && v / max > 0.55 ? "#fff" : "var(--tinta)" }}>
                        {v === null ? "" : Math.round(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ fontSize: 12 }}>Celdas vacías: menos de 5 clientes en común (k-anonimato). Últimos 30 días, 12 locales con más clientes.</p>
        </>
      )}
    </>
  );
}

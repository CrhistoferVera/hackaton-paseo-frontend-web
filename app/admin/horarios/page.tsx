"use client";

import { useState } from "react";
import { Cabecera, Cargando } from "@/components/marco";
import { colorCalor } from "@/components/plano";
import { bs, entero } from "@/lib/formato";
import { useDatos } from "@/lib/use-datos";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const HORAS = Array.from({ length: 14 }, (_, i) => i + 9);

/** HU-A09: matriz día de la semana × hora con visitas y ventas. */
export default function Horarios() {
  const [metrica, setMetrica] = useState<"visitas" | "compras" | "ventas">("compras");
  const { datos } = useDatos<any[]>("/admin/inteligencia/horarios?dias=90");
  const celda = (d: number, h: number) => datos?.find((x) => x.dia === d && x.hora === h)?.[metrica] ?? 0;
  const max = Math.max(1, ...(datos ?? []).map((x) => Number(x[metrica])));
  const orden = [1, 2, 3, 4, 5, 6, 0];
  const top = (datos ?? []).slice().sort((a, b) => b[metrica] - a[metrica]).slice(0, 3);

  return (
    <>
      <Cabecera ceja="¿Cuándo programar eventos y personal?" titulo="Días y horarios" descripcion="Últimos 90 días. Cada celda es una hora de un día de la semana.">
        <div className="segmentado">
          {(["visitas", "compras", "ventas"] as const).map((m) => <button key={m} className={metrica === m ? "on" : ""} onClick={() => setMetrica(m)}>{m}</button>)}
        </div>
      </Cabecera>
      {!datos ? <Cargando /> : (
        <>
          <p style={{ marginTop: 0 }}>
            Picos: {top.map((x, i) => <span key={i}><b>{DIAS[x.dia]} {x.hora}:00</b> ({metrica === "ventas" ? bs(x.ventas, 0) : entero(x[metrica])}){i < top.length - 1 ? ", " : "."}</span>)}
          </p>
          <div className="tabla-envoltura">
            <table style={{ borderCollapse: "separate", borderSpacing: 3, fontSize: 12 }}>
              <thead>
                <tr>
                  <th />
                  {HORAS.map((h) => <th key={h} className="senal muted" style={{ fontSize: 9.5, padding: 2 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {orden.map((d) => (
                  <tr key={d}>
                    <td className="senal muted" style={{ paddingRight: 10, fontSize: 9.5 }}>{DIAS[d]}</td>
                    {HORAS.map((h) => {
                      const v = Number(celda(d, h));
                      return (
                        <td key={h} title={`${DIAS[d]} ${h}:00 · ${metrica === "ventas" ? bs(v, 0) : entero(v)}`}
                          style={{ width: 46, height: 34, background: v ? colorCalor(v / max) : "var(--veladura)", opacity: v ? 0.35 + 0.65 * (v / max) : 1, textAlign: "center", color: v / max > 0.5 ? "#fff" : "var(--tinta)", fontVariantNumeric: "tabular-nums" }}>
                          {v ? (metrica === "ventas" ? Math.round(v / 1000) + "k" : v) : ""}
                        </td>
                      );
                    })}
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

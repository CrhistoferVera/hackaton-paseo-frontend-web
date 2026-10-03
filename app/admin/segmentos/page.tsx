"use client";

import { Barras } from "@/components/graficos";
import { Cabecera, Cargando, Mensajes, Seccion } from "@/components/marco";
import { api } from "@/lib/api";
import { bs, entero, fechaHora } from "@/lib/formato";
import { useSesion } from "@/lib/sesion";
import { useAccion, useDatos } from "@/lib/use-datos";

/** HU-A10: tabla RFM y segmentos generados con K-Means (nombres legibles por reglas o IA). */
export default function Segmentos() {
  const { usuario } = useSesion();
  const { datos: segs, recargar } = useDatos<any[]>("/admin/inteligencia/segmentos");
  const { datos: rfm } = useDatos<any>("/admin/inteligencia/rfm");
  const a = useAccion();

  async function recalcular() {
    const r = await a.ejecutar(() => api("/admin/inteligencia/segmentos/recalcular", { cuerpo: { k: 5 } }), "Segmentos recalculados con los datos de los últimos 6 meses");
    if (r) void recargar();
  }

  return (
    <>
      <Cabecera ceja="¿Quiénes son mis clientes?" titulo="Clientes y segmentos" descripcion="K-Means sobre recencia, frecuencia, gasto, horario habitual, fin de semana y categorías. La analítica ve alias, nunca nombres.">
        {usuario?.rol !== "marketing" && <button className="btn" onClick={recalcular} disabled={a.enviando}>{a.enviando ? "Calculando…" : "Recalcular segmentos"}</button>}
      </Cabecera>
      <Mensajes error={a.error} exito={a.exito} />
      {!segs ? <Cargando /> : (
        <div className="tabla-envoltura">
          <table className="libro">
            <thead><tr><th>Segmento</th><th className="der">Clientes</th><th className="der">Ticket</th><th>Horario típico</th><th>Categorías</th><th className="der">Promociones</th></tr></thead>
            <tbody>
              {segs.map((s) => (
                <tr key={s.id}>
                  <td><b className="display" style={{ fontSize: 18, fontWeight: 500 }}>{s.nombre}</b><small>{s.descripcion}</small></td>
                  <td className="der">{entero(s.tamano)}</td>
                  <td className="der">{bs(s.ticket_promedio, 0)}</td>
                  <td>{s.horario}</td>
                  <td>{s.categorias.join(", ")}</td>
                  <td className="der">{s.promociones}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {segs[0] && <p className="muted" style={{ fontSize: 12 }}>Calculado {fechaHora(segs[0].creado_en)} · {segs[0].criterios?.algoritmo}</p>}
        </div>
      )}
      {rfm && (
        <div className="dos-col">
          <Seccion titulo="Distribución RFM">
            <Barras datos={rfm.distribucion} x="grupo" y="clientes" />
          </Seccion>
          <Seccion titulo="Clientes frecuentes (RFM)">
            <div className="tabla-envoltura" style={{ maxHeight: 420, overflowY: "auto" }}>
              <table className="libro">
                <thead><tr><th>Cliente</th><th className="der">R</th><th className="der">F</th><th className="der">M</th><th className="der">Última</th><th className="der">Compras</th><th className="der">Gasto</th><th>Segmento</th></tr></thead>
                <tbody>
                  {rfm.clientes.slice(0, 50).map((c: any) => (
                    <tr key={c.cliente_id}>
                      <td>{c.alias}</td>
                      <td className="der">{c.r}</td><td className="der">{c.f}</td><td className="der">{c.m}</td>
                      <td className="der">{c.recencia} d</td>
                      <td className="der">{c.frecuencia}</td>
                      <td className="der">{bs(c.monto, 0)}</td>
                      <td>{c.segmento ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { Barras, Linea } from "@/components/graficos";
import { Cabecera, Cargando, Indicador, Seccion } from "@/components/marco";
import { bs, entero, fecha, pct } from "@/lib/formato";
import { useDatos } from "@/lib/use-datos";

/** HU-L08 (panel), HU-L09 (ranking), HU-L12 (categorías) y HU-Y16 (ventas PaseoYa). */
export default function Panel() {
  const [dias, setDias] = useState(30);
  const { datos: p } = useDatos<any>(`/local/panel?dias=${dias}`);
  const { datos: ranking } = useDatos<any>(`/local/panel/ranking?dias=90`);
  const { datos: cats } = useDatos<any[]>(`/local/panel/categorias?dias=${dias}`);
  const { datos: py } = useDatos<any>(`/local/paseoya/ventas?dias=${dias}`);
  const { datos: of } = useDatos<any>('/local/ofertas');

  const horas = Array.from({ length: 24 }, (_, h) => ({ hora: `${h}`, compras: p?.horas?.find((x: any) => x.hora === h)?.compras ?? 0 })).filter((x) => Number(x.hora) >= 8);
  const pico = p?.horas?.length ? [...p.horas].sort((a: any, b: any) => b.compras - a.compras)[0] : null;

  return (
    <>
      <Cabecera ceja="Resultados" titulo="Panel de clientes y ventas" descripcion="Lo que la app te trae: clientes únicos, nuevos contra recurrentes, ticket promedio y horas pico.">
        <div className="segmentado">
          {[7, 30, 90].map((d) => (
            <button key={d} className={dias === d ? "on" : ""} onClick={() => setDias(d)}>{d} días</button>
          ))}
        </div>
      </Cabecera>
      {of?.hoy?.ofertas > 0 && (
        <div className="aviso" style={{ marginBottom: 20 }}>
          <b>Ofertas de la IA para tu negocio:</b> hoy {entero(of.hoy.ofertas)} clientes recibieron una oferta personal de puntos multiplicados para venir a tu local
          {of.hoy.desde ? ` (entre las ${String(of.hoy.desde).slice(0, 5)} y las ${String(of.hoy.hasta).slice(0, 5)}, tus horas más tranquilas)` : ""}; ya se usaron {entero(of.hoy.usadas)}.
          {" "}En 14 días: {entero(of.serie.reduce((a: number, d: any) => a + d.usadas, 0))} visitas por ofertas. La IA reparte el público entre todos los locales, sin costo para ti.
        </div>
      )}
      {!p ? (
        <Cargando />
      ) : (
        <>
          <div className="indicadores">
            <Indicador etiqueta="Clientes únicos" valor={entero(p.clientes_unicos)} detalle={`${entero(p.nuevos)} nuevos · ${entero(p.recurrentes)} recurrentes`} />
            <Indicador etiqueta="Ventas registradas" valor={bs(p.ventas, 0)} detalle={`${entero(p.compras)} compras`} />
            <Indicador etiqueta="Ticket promedio" valor={bs(p.ticket_promedio, 0)} />
            <Indicador etiqueta="Puntos asignados" valor={entero(p.puntos_asignados)} oro />
            <Indicador
              etiqueta="Conversión de check-in"
              valor={p.conversion?.checkins ? pct((100 * p.conversion.con_compra) / p.conversion.checkins, 0) : "—"}
              detalle={`${entero(p.conversion?.checkins)} entradas con QR`}
            />
          </div>
          <div className="dos-col">
            <Seccion titulo="Horas pico" accion={pico && <span className="muted">Más compras a las {pico.hora}:00</span>}>
              <Barras datos={horas} x="hora" y="compras" />
            </Seccion>
            <Seccion titulo="Ventas por día">
              <Linea datos={(p.porDia ?? []).map((d: any) => ({ ...d, dia: fecha(d.fecha) }))} x="dia" series={[{ clave: "ventas", color: "#16140f", nombre: "Ventas" }]} formato={(v) => bs(v, 0)} />
            </Seccion>
          </div>
        </>
      )}

      {ranking && (
        <div className="dos-col">
          <Seccion titulo="Mejores clientes por gasto">
            <TablaRanking filas={ranking.porGasto} />
          </Seccion>
          <Seccion titulo="Mejores clientes por frecuencia">
            <TablaRanking filas={ranking.porFrecuencia} />
          </Seccion>
        </div>
      )}
      <p className="muted" style={{ fontSize: 13 }}>El nombre aparece solo si el cliente lo autorizó en su app; si no, ves un alias estable.</p>

      <div className="dos-col">
        {(
          <Seccion titulo="Categorías más vendidas con la app">
            {!cats?.length ? <div className="vacio">Sin datos.</div> : (
              <table className="libro">
                <thead><tr><th>Categoría</th><th className="der">Compras</th><th className="der">Ventas</th><th className="der">Clientes</th></tr></thead>
                <tbody>
                  {cats.map((c) => (
                    <tr key={c.categoria}><td>{c.categoria}</td><td className="der">{entero(c.compras)}</td><td className="der">{bs(c.ventas, 0)}</td><td className="der">{entero(c.clientes)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </Seccion>
        )}
        <Seccion titulo="Ventas PaseoYa">
          {!py ? <Cargando /> : (
            <>
              <div className="indicadores">
                <Indicador etiqueta="Pedidos" valor={entero(py.pedidos)} detalle={`${entero(py.vencidos)} vencidos`} />
                <Indicador etiqueta="Total" valor={bs(py.total_bs, 0)} />
                <Indicador etiqueta="Ticket" valor={bs(py.ticket_promedio, 0)} detalle={py.minutos_preparacion ? `${py.minutos_preparacion} min de preparación` : undefined} />
              </div>
              {py.productosMasVendidos?.length > 0 && (
                <table className="libro" style={{ marginTop: 16 }}>
                  <thead><tr><th>Producto</th><th className="der">Unidades</th><th className="der">Total</th></tr></thead>
                  <tbody>
                    {py.productosMasVendidos.map((x: any) => (
                      <tr key={x.nombre}><td>{x.nombre}</td><td className="der">{x.unidades}</td><td className="der">{bs(x.total_bs, 0)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </Seccion>
      </div>
    </>
  );
}

function TablaRanking({ filas }: { filas: any[] }) {
  if (!filas?.length) return <div className="vacio">Sin datos.</div>;
  return (
    <table className="libro">
      <thead><tr><th>#</th><th>Cliente</th><th className="der">Compras</th><th className="der">Gasto</th></tr></thead>
      <tbody>
        {filas.map((f, i) => (
          <tr key={i}>
            <td className="num muted">{i + 1}</td>
            <td>{f.cliente} {!f.autorizado && <span className="etiqueta tenue">alias</span>}</td>
            <td className="der">{f.compras}</td>
            <td className="der">{bs(f.gasto, 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


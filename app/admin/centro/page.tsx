"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { Mensajes } from "@/components/marco";
import { GemeloIso, Plano2D, type Plano, type Zona } from "@/components/plano";
import { Preguntar } from "@/components/preguntar";
import { api } from "@/lib/api";
import { bs, diasAtrasIso, entero, hoyIso, REGLA_FRAUDE } from "@/lib/formato";
import { useSesion } from "@/lib/sesion";
import { useTiempoReal } from "@/lib/tiempo-real";
import { useAccion, useDatos } from "@/lib/use-datos";

type Capa = "visitas" | "ventas" | "permanencia";
const UNIDAD: Record<Capa, string> = { visitas: "visitas", ventas: "Bs", permanencia: "min promedio" };

/** HU-A07, HU-A08, HU-A15, HU-X03, HU-X05, HU-X06, HU-Y18: el gemelo digital del Paseo. */
export default function Centro() {
  const { usuario } = useSesion();
  const { datos: plano } = useDatos<Plano>("/recinto/plano");
  const { datos: t, recargar: recargarTablero } = useDatos<any>("/admin/inteligencia/tablero");
  const { datos: resumen } = useDatos<any>("/admin/inteligencia/resumen");
  const [capa, setCapa] = useState<Capa>("visitas");
  const [rango, setRango] = useState<"hoy" | "semana">("semana");
  const [piso, setPiso] = useState("todo");
  const [vista2d, setVista2d] = useState(false);
  const [franja, setFranja] = useState<[number, number]>([0, 23]);
  const rutaCalor = `/admin/inteligencia/calor?metrica=${capa}&desde=${rango === "hoy" ? hoyIso() : diasAtrasIso(6)}&hasta=${hoyIso()}&horaDesde=${franja[0]}&horaHasta=${franja[1]}`;
  const { datos: calor, recargar: recargarCalor } = useDatos<any>(rutaCalor);
  const [eventos, setEventos] = useState<number | null>(null);
  const [pulsos, setPulsos] = useState(new Map<string, number>());
  const [ahora, setAhora] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const [hover, setHover] = useState<{ zona: Zona; x: number; y: number; serie: any[] } | null>(null);
  const [zonaSel, setZonaSel] = useState<Zona | null>(null);
  const [alertaNueva, setAlertaNueva] = useState<any | null>(null);
  const pendiente = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (t?.eventos_hoy !== undefined) setEventos((e) => Math.max(e ?? 0, t.eventos_hoy));
  }, [t]);

  const refrescar = useCallback(() => {
    if (pendiente.current) return;
    pendiente.current = setTimeout(() => {
      pendiente.current = null;
      void recargarTablero();
      void recargarCalor();
    }, 2500);
  }, [recargarTablero, recargarCalor]);

  useTiempoReal({
    evento: (e: any) => {
      setEventos((n) => (n ?? 0) + 1);
      if (e.zonaId) setPulsos((m) => new Map(m).set(e.zonaId, Date.now()));
      refrescar();
    },
    alerta: (a: any) => {
      setAlertaNueva(a);
      refrescar();
    },
    drop: (d: any) => {
      if (d.zonaId) setPulsos((m) => new Map(m).set(d.zonaId, Date.now()));
      refrescar();
    },
  });

  const valorZona = useMemo(() => new Map<string, number>((calor?.zonas ?? []).map((z: any) => [z.zona_id, Number(z.valor)])), [calor]);
  const valorLocal = useMemo(() => new Map<string, number>((calor?.locales ?? []).map((z: any) => [z.local_id, Number(z.valor)])), [calor]);

  async function alHover(z: Zona | null, pos?: { x: number; y: number }) {
    if (!z || !pos) return setHover(null);
    setHover({ zona: z, x: pos.x, y: pos.y, serie: [] });
    try {
      const serie = await api<any[]>(`/admin/inteligencia/zonas/${z.id}/serie`);
      setHover((h) => (h?.zona.id === z.id ? { ...h, serie: serie.map((s) => ({ ...s })) } : h));
    } catch {
      /* el tooltip sigue sin serie */
    }
  }

  const delta = t && t.usuarios_activos_previo ? Math.round((100 * (t.usuarios_activos - t.usuarios_activos_previo)) / t.usuarios_activos_previo) : null;
  const pisoDe2d = piso === "todo" ? "N1" : piso;

  return (
    <>
    <div className="sala" style={{ margin: "-32px -40px -80px", minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr" }}>
      <header style={{ display: "flex", gap: 22, alignItems: "center", padding: "14px 24px", borderBottom: "1px solid var(--sala-linea)", flexWrap: "wrap" }}>
        <span className="display" style={{ fontSize: 22 }}>Centro de Inteligencia <i style={{ color: "var(--sala-grafito)" }}>· Paseo Aranjuez</i></span>
        <span className="senal vivo" style={{ color: "var(--sala-oro)" }}>En vivo</span>
        <p style={{ flex: 1, minWidth: 280, margin: 0, fontSize: 13, color: "var(--sala-grafito)", borderLeft: "1px solid var(--sala-linea)", paddingLeft: 18, lineHeight: 1.45 }}>
          <b style={{ color: "var(--sala-tinta)", fontWeight: 500 }}>Resumen del día{resumen?.generadoPor === "llm" ? " (IA)" : ""}.</b> {resumen?.texto ?? "Calculando…"}
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", minHeight: 0 }} className="sala-cuerpo">
        <aside style={{ borderRight: "1px solid var(--sala-linea)", padding: "4px 20px 20px", overflowY: "auto" }}>
          {!t ? <p className="muted">Cargando…</p> : (
            <>
              <Kpi etiqueta="Usuarios activos de la app · 60 min" valor={entero(t.usuarios_activos)} detalle={delta !== null ? `${delta >= 0 ? "+" : ""}${delta} % sobre la hora anterior` : "app abierta en la última hora"} />
              <Kpi etiqueta="Visitantes con check-in hoy" valor={entero(t.visitantes_hoy)} />
              <Kpi etiqueta="Ventas registradas hoy" valor={bs(t.ventas_hoy, 0)} detalle={`${entero(t.compras_hoy)} compras`} />
              <Kpi etiqueta="Puntos hoy" valor={entero(t.puntos_emitidos_hoy)} detalle={`${entero(t.puntos_canjeados_hoy)} canjeados · ${entero(t.canjes_hoy)} canjes`} />
              <div style={{ padding: "13px 0", borderBottom: "1px solid var(--sala-linea)" }}>
                <span className="senal muted">Zonas calientes ahora</span>
                {(t.zonasCalientes ?? []).length === 0 && <p className="muted" style={{ fontSize: 12, margin: "6px 0 0" }}>Sin actividad en la última hora.</p>}
                {(t.zonasCalientes ?? []).map((z: any) => (
                  <div key={z.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }} className="num">
                    <span className="muted">{z.nombre} · {z.piso}</span>
                    <span>{z.usuarios}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "13px 0 13px 12px", borderBottom: "1px solid var(--sala-linea)", position: "relative" }}>
                <i style={{ position: "absolute", left: 0, top: 13, bottom: 13, width: 2, background: t.alertas_abiertas ? "#e0645a" : "var(--sala-linea)" }} />
                <span className="senal" style={{ color: t.alertas_abiertas ? "#e0645a" : "var(--sala-grafito)" }}>Alertas de fraude · {t.alertas_abiertas} abiertas</span>
                {(alertaNueva ? [alertaNueva, ...t.ultimasAlertas] : t.ultimasAlertas).slice(0, 2).map((a: any) => (
                  <p key={a.id} style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.4 }}>
                    {REGLA_FRAUDE[a.regla] ?? a.regla}{a.local ? ` · ${a.local}` : ""} <span className="muted">· {a.detalle}</span>
                  </p>
                ))}
                {usuario?.rol !== "marketing" && <a className="enlace" href="/admin/fraude" style={{ color: "var(--sala-tinta)", fontSize: 12 }}>Revisar alertas</a>}
              </div>
              <Kpi etiqueta="Tráfico inducido PaseoYa · 30 días" valor={`${t.trafico?.porcentaje ?? 0} %`} detalle={`de ${entero(t.trafico?.retiros)} retiros compró en otro local · +${bs(t.trafico?.monto_adicional_promedio, 0)} promedio`} />
              <Kpi etiqueta="Saldo de puntos por pagar" valor={entero(t.saldo_pendiente)} />
              <Kpi etiqueta="Eventos capturados hoy" valor={entero(eventos ?? t.eventos_hoy)} detalle="Cada punto es un dato" grande />
            </>
          )}
        </aside>

        <section style={{ position: "relative", minWidth: 0, minHeight: 640 }}>
          <div style={{ position: "absolute", inset: "8px 360px 8px 8px" }} className="lienzo">
            {plano && (vista2d ? (
              <div style={{ padding: 24 }}>
                <Plano2D plano={plano} piso={pisoDe2d} valorZona={valorZona} valorLocal={valorLocal} maxZona={calor?.max ?? 1} maxLocal={calor?.maxLocal ?? 1} oscuro />
              </div>
            ) : (
              <GemeloIso plano={plano} valorZona={valorZona} maxZona={calor?.max ?? 1} pulsos={pulsos} ahora={ahora} pisoVisible={piso} zonaSeleccionada={zonaSel?.id} onZona={setZonaSel} onHover={alHover} unidad={UNIDAD[capa]} />
            ))}
            {hover && !vista2d && (
              <div className="flotante" style={{ position: "absolute", left: `${(hover.x / 760) * 100}%`, top: `${(hover.y / 640) * 100}%`, transform: "translate(18px, -110%)", padding: "10px 14px", width: 190, pointerEvents: "none" }}>
                <span className="senal muted">{hover.zona.nombre} · {hover.zona.piso}</span>
                <div className="cifra" style={{ fontSize: 24, marginTop: 4 }}>
                  {capa === "ventas" ? bs(valorZona.get(hover.zona.id) ?? 0, 0) : entero(valorZona.get(hover.zona.id) ?? 0)}
                  <span className="muted" style={{ fontSize: 11, fontFamily: "var(--f-texto)", marginLeft: 6 }}>{capa === "ventas" ? "" : UNIDAD[capa]}</span>
                </div>
                <div style={{ height: 30 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hover.serie}>
                      <Line dataKey="eventos" stroke="#d4ae5c" dot={false} strokeWidth={1.3} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <span className="muted" style={{ fontSize: 10 }}>Eventos en los últimos 60 min</span>
              </div>
            )}
          </div>

          <div style={{ position: "absolute", top: 14, right: 18, display: "grid", gap: 8, justifyItems: "end" }}>
            <div className="segmentado">
              {["N1", "N2", "T", "todo"].map((p) => <button key={p} className={piso === p ? "on" : ""} onClick={() => setPiso(p)}>{p === "todo" ? "Todo" : p}</button>)}
            </div>
            <div className="segmentado">
              {(["visitas", "ventas", "permanencia"] as Capa[]).map((c) => <button key={c} className={capa === c ? "on" : ""} onClick={() => setCapa(c)}>{c}</button>)}
            </div>
            <div className="segmentado">
              <button className={rango === "hoy" ? "on" : ""} onClick={() => setRango("hoy")}>Hoy</button>
              <button className={rango === "semana" ? "on" : ""} onClick={() => setRango("semana")}>7 días</button>
              <button className={vista2d ? "on" : ""} onClick={() => setVista2d((v) => !v)}>Vista 2D</button>
            </div>
            <div className="segmentado">
              {([[0, 23, "Todo el día"], [10, 13, "Mañana"], [12, 15, "Mediodía"], [16, 22, "Tarde"]] as const).map(([a, b, n]) => (
                <button key={n} className={franja[0] === a && franja[1] === b ? "on" : ""} onClick={() => setFranja([a, b])}>{n}</button>
              ))}
            </div>
            <div style={{ width: 200 }}>
              <i style={{ display: "block", height: 5, background: "linear-gradient(90deg,#6fa58a,#d4a537 55%,#b4582e)" }} />
              <div className="senal muted" style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginTop: 4 }}><span>Fría</span><span>Media</span><span>Saturada</span></div>
            </div>
            <p className="muted" style={{ fontSize: 11, margin: 0, maxWidth: 220, textAlign: "right" }}>Toca una zona para ver su detalle o lanzar un Drop.</p>
          </div>

          <div className="flotante" style={{ position: "absolute", right: 18, bottom: 18, width: 340, padding: "14px 16px", maxHeight: "60%", overflow: "hidden", display: "flex" }}>
            <Preguntar />
          </div>
        </section>
      </div>

      <style>{`@media (max-width: 1200px){ .sala-cuerpo { grid-template-columns: 1fr !important; } .lienzo { position: relative !important; inset: auto !important; height: 560px; } }`}</style>
    </div>
    {zonaSel && <PanelZona zona={zonaSel} valor={valorZona.get(zonaSel.id) ?? 0} unidad={UNIDAD[capa]} plano={plano!} puedeLanzar={usuario?.rol !== "analista"} onCerrar={() => setZonaSel(null)} />}
    </>
  );
}

function Kpi({ etiqueta, valor, detalle, grande }: { etiqueta: string; valor: React.ReactNode; detalle?: string; grande?: boolean }) {
  return (
    <div style={{ padding: "13px 0", borderBottom: "1px solid var(--sala-linea)" }}>
      <span className="senal muted">{etiqueta}</span>
      <span className="cifra num" style={{ display: "block", fontSize: grande ? 36 : 28, marginTop: 4 }}>{valor}</span>
      {detalle && <span className="muted" style={{ fontSize: 11 }}>{detalle}</span>}
    </div>
  );
}

function PanelZona({ zona, valor, unidad, plano, puedeLanzar, onCerrar }: { zona: Zona; valor: number; unidad: string; plano: Plano; puedeLanzar: boolean; onCerrar: () => void }) {
  const { datos: productos } = useDatos<any[]>("/admin/paseoya/productos");
  const locales = plano.locales.filter((l) => l.zona_id === zona.id);
  const [f, setF] = useState({ productoId: "", precioEspecial: "", mensaje: `Caja sorpresa en ${zona.nombre}`, minutos: 60, maxReclamos: 50 });
  const a = useAccion();
  const [lanzado, setLanzado] = useState<any | null>(null);
  const prod = productos?.find((p) => p.id === f.productoId);

  async function lanzar(e: React.FormEvent) {
    e.preventDefault();
    const r = await a.ejecutar(() => api("/admin/drops", { cuerpo: { zonaId: zona.id, productoId: f.productoId, precioEspecial: Number(f.precioEspecial), mensaje: f.mensaje, minutos: Number(f.minutos), maxReclamos: Number(f.maxReclamos) } }));
    if (r) setLanzado(r);
  }

  return (
    <>
      <div className="velo" onClick={onCerrar} />
      <aside className="panel-lateral" role="dialog" aria-label={zona.nombre}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="ceja senal">{zona.piso} · Sector {zona.sector}</span>
          <button className="enlace" onClick={onCerrar}>Cerrar</button>
        </div>
        <h2 className="display" style={{ fontSize: 30, margin: "0 0 6px" }}>{zona.nombre}</h2>
        <p className="muted" style={{ margin: 0 }}>{entero(valor)} {unidad} en el período seleccionado</p>
        <table className="libro" style={{ marginTop: 16 }}>
          <tbody>
            {locales.map((l) => <tr key={l.id}><td>{l.nombre}</td><td className="muted">{l.categoria}</td><td className="der dato">{l.numero_local}</td></tr>)}
          </tbody>
        </table>
        {puedeLanzar && (
          <section style={{ marginTop: 28 }}>
            <h3 className="display" style={{ fontSize: 22, margin: "0 0 4px" }}>Lanzar Drop</h3>
            <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>Avisa a los clientes que están en el Paseo. El Drop aparece en la app y en el mapa sobre el local del producto; quien lo reclame dentro del Paseo desbloquea el precio especial en PaseoYa.</p>
            {lanzado ? (
              <div className="aviso exito">
                Drop activo hasta las {new Date(lanzado.fin).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}. Avisamos a {lanzado.avisados} clientes; ya aparece en la app sobre {lanzado.local}. Mira cómo cambia el color de la zona en el gemelo.
              </div>
            ) : (
              <form onSubmit={lanzar} style={{ display: "grid", gap: 14 }}>
                <label className="campo">
                  <span>Producto oculto en PaseoYa</span>
                  <select required value={f.productoId} onChange={(e) => setF({ ...f, productoId: e.target.value })}>
                    <option value="">Elige…</option>
                    {productos?.map((p) => <option key={p.id} value={p.id}>{p.nombre} · {p.local} · {bs(p.precio_bs)}</option>)}
                  </select>
                </label>
                <div className="fila-campos">
                  <label className="campo"><span>Precio especial (Bs)</span><input required type="number" step="0.5" min="1" value={f.precioEspecial} onChange={(e) => setF({ ...f, precioEspecial: e.target.value })} placeholder={prod ? String(Math.round(prod.precio_bs * 0.7)) : ""} /></label>
                  <label className="campo"><span>Duración (min)</span><input type="number" min="5" value={f.minutos} onChange={(e) => setF({ ...f, minutos: Number(e.target.value) })} /></label>
                </div>
                <label className="campo"><span>Mensaje</span><input value={f.mensaje} maxLength={140} onChange={(e) => setF({ ...f, mensaje: e.target.value })} /></label>
                <label className="campo"><span>Máximo de cajas</span><input type="number" min="1" value={f.maxReclamos} onChange={(e) => setF({ ...f, maxReclamos: Number(e.target.value) })} /></label>
                <Mensajes error={a.error} />
                <button className="btn oro grande" disabled={a.enviando}>Lanzar Drop en {zona.nombre}</button>
              </form>
            )}
          </section>
        )}
      </aside>
    </>
  );
}

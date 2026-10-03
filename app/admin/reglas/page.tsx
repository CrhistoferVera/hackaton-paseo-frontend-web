"use client";

import { useEffect, useState } from "react";
import { Cabecera, Cargando, Mensajes, Seccion } from "@/components/marco";
import { api } from "@/lib/api";
import { bs, fechaHora } from "@/lib/formato";
import { useSesion } from "@/lib/sesion";
import { useAccion, useDatos } from "@/lib/use-datos";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** HU-A03: valor del punto, multiplicadores, vencimiento y niveles. Cada cambio crea una versión auditada. */
export default function Reglas() {
  const { usuario } = useSesion();
  const editable = usuario?.rol === "admin";
  const { datos, recargar } = useDatos<any>("/admin/reglas");
  const { datos: categorias } = useDatos<any[]>("/recinto/categorias");
  const [r, setR] = useState<any | null>(null);
  const a = useAccion();

  useEffect(() => {
    if (datos?.vigente) setR(structuredClone(datos.vigente));
  }, [datos]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const n = (v: any) => Number(v);
    const cuerpo = {
      bs_por_punto: n(r.bs_por_punto), valor_punto_bs: n(r.valor_punto_bs), dias_vencimiento: n(r.dias_vencimiento),
      bono_bienvenida: n(r.bono_bienvenida), puntos_descubrimiento: n(r.puntos_descubrimiento), puntos_visita_diaria: n(r.puntos_visita_diaria),
      puntos_referido: n(r.puntos_referido), puntos_hora_parqueo: n(r.puntos_hora_parqueo),
      multiplicadores_categoria: Object.fromEntries(Object.entries(r.multiplicadores_categoria).filter(([, v]) => Number(v) > 0 && Number(v) !== 1).map(([k, v]) => [k, Number(v)])),
      multiplicadores_horario: r.multiplicadores_horario.map((h: any) => ({ ...h, mult: Number(h.mult) })),
      niveles: r.niveles.map((x: any) => ({ ...x, minimo: Number(x.minimo), beneficios: typeof x.beneficios === "string" ? x.beneficios.split("\n").filter(Boolean) : x.beneficios })),
    };
    const ok = await a.ejecutar(() => api("/admin/reglas", { metodo: "PUT", cuerpo }), "Nueva versión vigente. El cambio quedó en la auditoría.");
    if (ok) void recargar();
  }

  if (!r) return <Cargando />;
  const campo = (k: string, t: string, paso = "1") => (
    <label className="campo"><span>{t}</span><input type="number" step={paso} disabled={!editable} value={r[k]} onChange={(e) => setR({ ...r, [k]: e.target.value })} /></label>
  );

  return (
    <>
      <Cabecera ceja="¿Cuánto me cuesta el programa?" titulo="Reglas de puntos" descripcion={`Versión ${r.version} vigente. Con Bs ${r.bs_por_punto} = 1 punto y ${bs(r.valor_punto_bs)} por punto, el retorno al cliente es ${(100 * Number(r.valor_punto_bs) / Number(r.bs_por_punto)).toFixed(1)} %.`} />
      <form onSubmit={guardar} style={{ display: "grid", gap: 8 }}>
        <Seccion titulo="Economía del punto">
          <div className="fila-campos">
            {campo("bs_por_punto", "Bs por punto", "0.1")}
            {campo("valor_punto_bs", "Valor de canje (Bs por punto)", "0.005")}
            {campo("dias_vencimiento", "Días hasta el vencimiento")}
          </div>
        </Seccion>
        <Seccion titulo="Puntos por acción">
          <div className="fila-campos">
            {campo("bono_bienvenida", "Bono de bienvenida")}
            {campo("puntos_visita_diaria", "Llegada diaria al Paseo")}
            {campo("puntos_descubrimiento", "Primera visita a un local")}
            {campo("puntos_referido", "Referido (a cada uno)")}
            {campo("puntos_hora_parqueo", "Puntos por hora de parqueo")}
          </div>
        </Seccion>
        <Seccion titulo="Multiplicadores por categoría">
          <div className="fila-campos">
            {categorias?.map((c) => (
              <label className="campo" key={c.id}>
                <span>{c.nombre}</span>
                <input type="number" step="0.1" min="0" disabled={!editable} value={r.multiplicadores_categoria[c.nombre] ?? 1} onChange={(e) => setR({ ...r, multiplicadores_categoria: { ...r.multiplicadores_categoria, [c.nombre]: e.target.value } })} />
              </label>
            ))}
          </div>
        </Seccion>
        <Seccion titulo="Multiplicadores por horario" accion={editable && <button type="button" className="btn chico claro" onClick={() => setR({ ...r, multiplicadores_horario: [...r.multiplicadores_horario, { dias: [1, 2, 3, 4], desde: "15:00", hasta: "17:00", mult: 1.5, etiqueta: "Nueva franja" }] })}>Agregar franja</button>}>
          <table className="libro">
            <tbody>
              {r.multiplicadores_horario.map((h: any, i: number) => (
                <tr key={i}>
                  <td><input className="entrada" disabled={!editable} value={h.etiqueta ?? ""} onChange={(e) => { const m = [...r.multiplicadores_horario]; m[i] = { ...h, etiqueta: e.target.value }; setR({ ...r, multiplicadores_horario: m }); }} /></td>
                  <td>
                    <div className="segmentado">
                      {DIAS.map((d, k) => <button type="button" key={d} disabled={!editable} className={h.dias.includes(k) ? "on" : ""} onClick={() => { const m = [...r.multiplicadores_horario]; m[i] = { ...h, dias: h.dias.includes(k) ? h.dias.filter((x: number) => x !== k) : [...h.dias, k].sort() }; setR({ ...r, multiplicadores_horario: m }); }}>{d}</button>)}
                    </div>
                  </td>
                  <td><input className="entrada" type="time" disabled={!editable} value={h.desde} onChange={(e) => { const m = [...r.multiplicadores_horario]; m[i] = { ...h, desde: e.target.value }; setR({ ...r, multiplicadores_horario: m }); }} /></td>
                  <td><input className="entrada" type="time" disabled={!editable} value={h.hasta} onChange={(e) => { const m = [...r.multiplicadores_horario]; m[i] = { ...h, hasta: e.target.value }; setR({ ...r, multiplicadores_horario: m }); }} /></td>
                  <td style={{ width: 90 }}><input className="entrada" type="number" step="0.1" disabled={!editable} value={h.mult} onChange={(e) => { const m = [...r.multiplicadores_horario]; m[i] = { ...h, mult: e.target.value }; setR({ ...r, multiplicadores_horario: m }); }} /></td>
                  <td>{editable && <button type="button" className="enlace" onClick={() => setR({ ...r, multiplicadores_horario: r.multiplicadores_horario.filter((_: any, k: number) => k !== i) })}>Quitar</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Seccion>
        <Seccion titulo="Niveles (puntos ganados en 12 meses)">
          <div className="fila-campos">
            {r.niveles.map((n: any, i: number) => (
              <div key={n.nombre} style={{ display: "grid", gap: 8 }}>
                <label className="campo"><span>{n.nombre} desde</span><input type="number" disabled={!editable || i === 0} value={n.minimo} onChange={(e) => { const m = [...r.niveles]; m[i] = { ...n, minimo: e.target.value }; setR({ ...r, niveles: m }); }} /></label>
                <label className="campo"><span>Beneficios (uno por línea)</span><textarea rows={3} disabled={!editable} value={Array.isArray(n.beneficios) ? n.beneficios.join("\n") : n.beneficios} onChange={(e) => { const m = [...r.niveles]; m[i] = { ...n, beneficios: e.target.value }; setR({ ...r, niveles: m }); }} /></label>
              </div>
            ))}
          </div>
        </Seccion>
        <Mensajes error={a.error} exito={a.exito} />
        {editable && <div><button className="btn grande" disabled={a.enviando}>Publicar nueva versión</button></div>}
      </form>
      <Seccion titulo="Historial de versiones">
        <table className="libro">
          <thead><tr><th>Versión</th><th>Fecha</th><th>Autor</th><th className="der">Bs/punto</th><th className="der">Valor punto</th><th className="der">Vencimiento</th></tr></thead>
          <tbody>
            {datos?.historial?.map((h: any) => (
              <tr key={h.id}>
                <td>v{h.version} {h.vigente && <span className="etiqueta llena">vigente</span>}</td>
                <td>{fechaHora(h.creado_en)}</td>
                <td>{h.creado_por_nombre ?? "—"}</td>
                <td className="der">{Number(h.bs_por_punto)}</td>
                <td className="der">{bs(h.valor_punto_bs, 3)}</td>
                <td className="der">{h.dias_vencimiento} días</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Seccion>
    </>
  );
}

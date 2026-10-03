"use client";

import { useState } from "react";
import { Cabecera, Cargando, Mensajes, PanelLateral } from "@/components/marco";
import { api } from "@/lib/api";
import { bs, entero, fecha } from "@/lib/formato";
import { useAccion, useDatos } from "@/lib/use-datos";

/** HU-A04: catálogo de beneficios (costo, local, stock, temporada, vigencia). */
export default function Recompensas() {
  const { datos, recargar } = useDatos<any[]>("/admin/recompensas");
  const { datos: plano } = useDatos<any>("/recinto/plano");
  const { datos: regla } = useDatos<any>("/admin/reglas");
  const [f, setF] = useState<any | null>(null);
  const a = useAccion();
  const valor = Number(regla?.vigente?.valor_punto_bs ?? 0.02);

  const abrir = (r?: any) =>
    setF(r ? { id: r.id, nombre: r.nombre, descripcion: r.descripcion, costoPuntos: r.costo_puntos, localId: r.local_id ?? "", stock: r.stock ?? "", temporada: r.temporada ?? "", vigenciaDesde: r.vigencia_desde?.slice(0, 10) ?? "", vigenciaHasta: r.vigencia_hasta?.slice(0, 10) ?? "", activo: r.activo }
      : { id: "", nombre: "", descripcion: "", costoPuntos: 500, localId: "", stock: "", temporada: "", vigenciaDesde: "", vigenciaHasta: "", activo: true });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const cuerpo = {
      nombre: f.nombre, descripcion: f.descripcion, costoPuntos: Number(f.costoPuntos), localId: f.localId || null, stock: f.stock === "" ? null : Number(f.stock),
      temporada: f.temporada || null, vigenciaDesde: f.vigenciaDesde || null, vigenciaHasta: f.vigenciaHasta || null, activo: f.activo,
    };
    const r = await a.ejecutar(() => (f.id ? api(`/admin/recompensas/${f.id}`, { metodo: "PATCH", cuerpo }) : api("/admin/recompensas", { cuerpo })), "Recompensa guardada");
    if (r) {
      setF(null);
      void recargar();
    }
  }

  return (
    <>
      <Cabecera ceja="Programa" titulo="Recompensas" descripcion="El cliente ve primero lo que ya puede canjear. Los puntos se descuentan cuando el local valida el cupón.">
        <button className="btn" onClick={() => abrir()}>Nueva recompensa</button>
      </Cabecera>
      <Mensajes exito={!f ? a.exito : null} />
      {!datos ? <Cargando /> : (
        <table className="libro">
          <thead><tr><th>Recompensa</th><th>Local</th><th className="der">Costo</th><th className="der">Equivale a</th><th className="der">Stock</th><th>Vigencia</th><th className="der">Canjes</th><th>Estado</th></tr></thead>
          <tbody>
            {datos.map((r) => (
              <tr key={r.id} className="clic" onClick={() => abrir(r)}>
                <td>{r.nombre}<small>{r.descripcion}</small></td>
                <td>{r.local ?? "Todo el Paseo"}</td>
                <td className="der oro">{entero(r.costo_puntos)} pts</td>
                <td className="der muted">{bs(r.costo_puntos * valor)}</td>
                <td className="der">{r.stock ?? "∞"}</td>
                <td>{r.vigencia_hasta ? `hasta ${fecha(r.vigencia_hasta)}` : "Sin fin"}</td>
                <td className="der">{r.canjes}</td>
                <td>{r.activo ? <span className="etiqueta exito">Activa</span> : <span className="etiqueta tenue">Pausada</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <PanelLateral abierto={!!f} titulo={f?.id ? "Editar recompensa" : "Nueva recompensa"} onCerrar={() => setF(null)}>
        {f && (
          <form onSubmit={guardar} style={{ display: "grid", gap: 14 }}>
            <label className="campo"><span>Nombre</span><input required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
            <label className="campo"><span>Descripción</span><input value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></label>
            <label className="campo"><span>Costo en puntos</span><input required type="number" min={1} value={f.costoPuntos} onChange={(e) => setF({ ...f, costoPuntos: e.target.value })} /><small>Equivale a {bs(Number(f.costoPuntos) * valor)} al valor vigente del punto.</small></label>
            <label className="campo">
              <span>Local donde se canjea</span>
              <select value={f.localId} onChange={(e) => setF({ ...f, localId: e.target.value })}>
                <option value="">Cualquier local (Paseo)</option>
                {plano?.locales.map((l: any) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </label>
            <div className="fila-campos">
              <label className="campo"><span>Stock</span><input type="number" min={0} value={f.stock} placeholder="Ilimitado" onChange={(e) => setF({ ...f, stock: e.target.value })} /></label>
              <label className="campo"><span>Temporada</span><input value={f.temporada} placeholder="Navidad" onChange={(e) => setF({ ...f, temporada: e.target.value })} /></label>
            </div>
            <div className="fila-campos">
              <label className="campo"><span>Desde</span><input type="date" value={f.vigenciaDesde} onChange={(e) => setF({ ...f, vigenciaDesde: e.target.value })} /></label>
              <label className="campo"><span>Hasta</span><input type="date" value={f.vigenciaHasta} onChange={(e) => setF({ ...f, vigenciaHasta: e.target.value })} /></label>
            </div>
            <label style={{ display: "flex", gap: 8 }}><input type="checkbox" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} /> Visible en el catálogo</label>
            <Mensajes error={a.error} />
            <button className="btn" disabled={a.enviando}>Guardar</button>
          </form>
        )}
      </PanelLateral>
    </>
  );
}

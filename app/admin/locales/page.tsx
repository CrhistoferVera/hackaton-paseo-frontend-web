"use client";

import { useState } from "react";
import { Cabecera, Cargando, Mensajes, PanelLateral } from "@/components/marco";
import { Plano2D, type Plano } from "@/components/plano";
import { api, descargar } from "@/lib/api";
import { useAccion, useDatos } from "@/lib/use-datos";

const VACIO = { id: "", nombre: "", categoriaId: "", piso: "N1", sector: "A", numeroLocal: "", coordX: 500, coordY: 300, horarioApertura: "10:00", horarioCierre: "22:00", descripcion: "", palabrasClave: "", nit: "", activo: true };

/** HU-A01: CRUD de locales con categoría, piso, sector, número y posición en el plano. */
export default function Locales() {
  const { datos: plano, recargar } = useDatos<Plano & { locales: any[] }>("/recinto/plano");
  const { datos: categorias } = useDatos<any[]>("/recinto/categorias");
  const [piso, setPiso] = useState("N1");
  const [f, setF] = useState<any | null>(null);
  const a = useAccion();

  const abrir = (l?: any) =>
    setF(l ? {
      id: l.id, nombre: l.nombre, categoriaId: l.categoria_id, piso: l.piso, sector: l.sector, numeroLocal: l.numero_local, coordX: Number(l.coord_x), coordY: Number(l.coord_y),
      horarioApertura: l.horario_apertura.slice(0, 5), horarioCierre: l.horario_cierre.slice(0, 5), descripcion: l.descripcion, palabrasClave: (l.palabras_clave ?? []).join(", "), nit: l.nit ?? "", activo: l.activo,
    } : { ...VACIO, piso });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const cuerpo = { ...f, coordX: Number(f.coordX), coordY: Number(f.coordY), palabrasClave: f.palabrasClave.split(",").map((s: string) => s.trim()).filter(Boolean), nit: f.nit || null };
    delete cuerpo.id;
    const r = await a.ejecutar(() => (f.id ? api(`/admin/locales/${f.id}`, { metodo: "PATCH", cuerpo }) : api("/admin/locales", { cuerpo })), "Local guardado");
    if (r) {
      setF(null);
      void recargar();
    }
  }

  const locales = plano?.locales.filter((l) => l.piso === piso) ?? [];
  return (
    <>
      <Cabecera ceja="¿Dónde está cada local?" titulo="Locales y plano" descripcion="Toca el plano para ubicar un local nuevo o mover el seleccionado. La zona se asigna sola según la posición.">
        <div className="segmentado">{["N1", "N2", "T"].map((p) => <button key={p} className={piso === p ? "on" : ""} onClick={() => setPiso(p)}>{p}</button>)}</div>
        <button className="btn" onClick={() => abrir()}>Nuevo local</button>
      </Cabecera>
      <Mensajes exito={!f ? a.exito : null} />
      {!plano ? <Cargando /> : (
        <div className="dos-col">
          <div>
            <Plano2D
              plano={plano}
              piso={f ? f.piso : piso}
              seleccionado={f?.id ?? null}
              onLocal={(l) => abrir(plano.locales.find((x) => x.id === l.id))}
              onPunto={(x, y) => (f ? setF({ ...f, coordX: x, coordY: y }) : setF({ ...VACIO, piso, coordX: x, coordY: y }))}
            />
            {f && <p className="muted" style={{ fontSize: 13 }}>Posición: <span className="dato">{f.coordX}, {f.coordY}</span> en {f.piso}</p>}
          </div>
          <table className="libro">
            <thead><tr><th>Local</th><th>Categoría</th><th>Número</th><th>Estado</th></tr></thead>
            <tbody>
              {locales.map((l: any) => (
                <tr key={l.id} className="clic" onClick={() => abrir(l)}>
                  <td>{l.nombre}<small>Sector {l.sector}</small></td>
                  <td>{l.categoria}</td>
                  <td className="dato">{l.numero_local}</td>
                  <td>{l.activo ? <span className="etiqueta exito">Activo</span> : <span className="etiqueta tenue">Inactivo</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PanelLateral abierto={!!f} titulo={f?.id ? "Editar local" : "Nuevo local"} onCerrar={() => setF(null)}>
        {f && (
          <form onSubmit={guardar} style={{ display: "grid", gap: 14 }}>
            <label className="campo"><span>Nombre</span><input required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
            <label className="campo">
              <span>Categoría</span>
              <select required value={f.categoriaId} onChange={(e) => setF({ ...f, categoriaId: e.target.value })}>
                <option value="">Elige…</option>
                {categorias?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </label>
            <div className="fila-campos">
              <label className="campo"><span>Piso</span><select value={f.piso} onChange={(e) => setF({ ...f, piso: e.target.value })}><option>N1</option><option>N2</option><option>T</option></select></label>
              <label className="campo"><span>Sector</span><input required value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value })} /></label>
              <label className="campo"><span>N.º de local</span><input required value={f.numeroLocal} onChange={(e) => setF({ ...f, numeroLocal: e.target.value })} /></label>
            </div>
            <div className="fila-campos">
              <label className="campo"><span>X en el plano</span><input type="number" min={0} max={1000} value={f.coordX} onChange={(e) => setF({ ...f, coordX: e.target.value })} /></label>
              <label className="campo"><span>Y en el plano</span><input type="number" min={0} max={600} value={f.coordY} onChange={(e) => setF({ ...f, coordY: e.target.value })} /></label>
            </div>
            <div className="fila-campos">
              <label className="campo"><span>Abre</span><input type="time" value={f.horarioApertura} onChange={(e) => setF({ ...f, horarioApertura: e.target.value })} /></label>
              <label className="campo"><span>Cierra</span><input type="time" value={f.horarioCierre} onChange={(e) => setF({ ...f, horarioCierre: e.target.value })} /></label>
            </div>
            <label className="campo"><span>Descripción</span><input value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></label>
            <label className="campo"><span>Palabras clave para el buscador</span><input value={f.palabrasClave} onChange={(e) => setF({ ...f, palabrasClave: e.target.value })} placeholder="café, desayuno" /></label>
            <label className="campo"><span>NIT (para facturas SIAT)</span><input value={f.nit} onChange={(e) => setF({ ...f, nit: e.target.value })} /></label>
            <label style={{ display: "flex", gap: 8 }}><input type="checkbox" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} /> Activo</label>
            <Mensajes error={a.error} />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <button className="btn" disabled={a.enviando}>Guardar</button>
              {f.id && <button type="button" className="btn claro" onClick={() => a.ejecutar(() => descargar(`/admin/locales/${f.id}/qr-puerta.pdf`, `qr-${f.nombre}.pdf`))}>QR de la puerta</button>}
            </div>
          </form>
        )}
      </PanelLateral>
    </>
  );
}

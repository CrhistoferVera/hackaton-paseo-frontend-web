"use client";

import { useState } from "react";
import { Cabecera, Mensajes, Seccion } from "@/components/marco";
import { api } from "@/lib/api";
import { bs, diasAtrasIso, fecha } from "@/lib/formato";
import { useAccion, useDatos } from "@/lib/use-datos";

/** HU-Y17 (categorías y asignación de locales) y HU-Y19 (productos destacados). */
export default function Categorias() {
  const { datos: cats, recargar } = useDatos<any[]>("/recinto/categorias");
  const [q, setQ] = useState("");
  const { datos: productos, recargar: recargarProductos } = useDatos<any[]>(`/admin/paseoya/productos${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  const [nueva, setNueva] = useState({ nombre: "", ambito: "tiendas" });
  const a = useAccion();

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const r = await a.ejecutar(() => api("/admin/categorias", { cuerpo: nueva }), "Categoría creada");
    if (r) {
      setNueva({ nombre: "", ambito: "tiendas" });
      void recargar();
    }
  }
  async function renombrar(c: any) {
    const nombre = window.prompt?.("Nuevo nombre", c.nombre);
    if (!nombre) return;
    await a.ejecutar(() => api(`/admin/categorias/${c.id}`, { metodo: "PATCH", cuerpo: { nombre } }), "Categoría actualizada");
    void recargar();
  }
  async function eliminar(c: any) {
    await a.ejecutar(() => api(`/admin/categorias/${c.id}`, { metodo: "DELETE" }), "Categoría eliminada");
    void recargar();
  }
  async function destacar(p: any, dias: number | null) {
    await a.ejecutar(() => api(`/admin/paseoya/productos/${p.id}/destacar`, { cuerpo: { hasta: dias === null ? null : diasAtrasIso(-dias) } }), dias === null ? "Ya no está destacado" : `Destacado por ${dias} días`);
    void recargarProductos();
  }

  return (
    <>
      <Cabecera ceja="PaseoYa" titulo="Categorías y destacados" descripcion="Las categorías organizan el directorio y PaseoYa. Para reasignar un local a otra categoría, edítalo en Locales y plano." />
      <Mensajes error={a.error} exito={a.exito} />
      <div className="dos-col">
        <Seccion titulo="Categorías">
          <table className="libro">
            <thead><tr><th>Categoría</th><th>Ámbito</th><th className="der">Locales</th><th className="der">Productos</th><th /></tr></thead>
            <tbody>
              {cats?.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre}</td>
                  <td>{c.ambito === "comida" ? "Plaza de comidas" : "Tiendas"}</td>
                  <td className="der">{c.locales}</td>
                  <td className="der">{c.productos}</td>
                  <td className="der" style={{ whiteSpace: "nowrap" }}>
                    <button className="enlace" onClick={() => renombrar(c)}>Renombrar</button>
                    {c.locales === 0 && c.productos === 0 && <> · <button className="enlace" onClick={() => eliminar(c)}>Eliminar</button></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <form onSubmit={crear} style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "end" }}>
            <label className="campo" style={{ flex: 1 }}><span>Nueva categoría</span><input required value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} /></label>
            <label className="campo"><span>Ámbito</span><select value={nueva.ambito} onChange={(e) => setNueva({ ...nueva, ambito: e.target.value })}><option value="tiendas">Tiendas</option><option value="comida">Plaza de comidas</option></select></label>
            <button className="btn">Crear</button>
          </form>
        </Seccion>
        <Seccion titulo="Productos destacados" accion={<input className="entrada" style={{ maxWidth: 220 }} placeholder="Buscar producto" value={q} onChange={(e) => setQ(e.target.value)} />}>
          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            <table className="libro">
              <tbody>
                {productos?.map((p) => {
                  const activo = p.destacado_hasta && new Date(p.destacado_hasta) >= new Date(new Date().toDateString());
                  return (
                    <tr key={p.id}>
                      <td>{p.nombre}<small>{p.local} · {bs(p.precio_bs)}</small></td>
                      <td>{activo ? <span className="etiqueta oro">hasta {fecha(p.destacado_hasta)}</span> : null}</td>
                      <td className="der" style={{ whiteSpace: "nowrap" }}>
                        {activo ? <button className="btn chico claro" onClick={() => destacar(p, null)}>Quitar</button> : <button className="btn chico" onClick={() => destacar(p, 14)}>Destacar 14 días</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Seccion>
      </div>
    </>
  );
}

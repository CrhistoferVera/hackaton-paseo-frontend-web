"use client";

import { Guia, ListaPaginada } from "@/components/admin-ui";
import { useState } from "react";
import { Cabecera, Mensajes, PanelLateral, Seccion } from "@/components/marco";
import { api } from "@/lib/api";
import { bs, diasAtrasIso, fecha } from "@/lib/formato";
import { useAccion, useDatos } from "@/lib/use-datos";

/** HU-Y17 (categorías y asignación de locales) y HU-Y19 (productos destacados). */
export default function Categorias() {
  const { datos: cats, recargar } = useDatos<any[]>("/recinto/categorias");
  const [q, setQ] = useState("");
  const { datos: productos, recargar: recargarProductos } = useDatos<any[]>(
    `/admin/paseoya/productos${q ? `?q=${encodeURIComponent(q)}` : ""}`,
  );
  const [nueva, setNueva] = useState({ nombre: "", ambito: "tiendas" });
  const a = useAccion();
  const [vista, setVista] = useState("categorias");
  const [duracion, setDuracion] = useState(14);
  const [edicion, setEdicion] = useState<{ id: string; nombre: string } | null>(null);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const r = await a.ejecutar(() => api("/admin/categorias", { cuerpo: nueva }), "Categoría creada");
    if (r) {
      setNueva({ nombre: "", ambito: "tiendas" });
      void recargar();
    }
  }
  async function renombrar(e: React.FormEvent) {
    e.preventDefault();
    if (!edicion?.nombre.trim()) return;
    const ok = await a.ejecutar(() => api(`/admin/categorias/${edicion.id}`, { metodo: "PATCH", cuerpo: { nombre: edicion.nombre.trim() } }), "Categoría actualizada");
    if (ok) { setEdicion(null); void recargar(); }
  }
  async function eliminar(c: any) {
    await a.ejecutar(() => api(`/admin/categorias/${c.id}`, { metodo: "DELETE" }), "Categoría eliminada");
    void recargar();
  }
  async function destacar(p: any, dias: number | null) {
    await a.ejecutar(
      () => api(`/admin/paseoya/productos/${p.id}/destacar`, { cuerpo: { hasta: dias === null ? null : diasAtrasIso(-dias) } }),
      dias === null ? "Ya no está destacado" : `Destacado por ${dias} días`,
    );
    void recargarProductos();
  }

  return (
    <>
      <Cabecera
        ceja="PaseoYa"
        titulo="Categorías y destacados"
        descripcion="Las categorías organizan el directorio y PaseoYa. Para reasignar un local a otra categoría, edítalo en Locales y plano."
      />
      <Mensajes error={a.error} exito={a.exito} />
      <div className="admin-toolbar segmentado">
        <button className={vista === "categorias" ? "on" : ""} onClick={() => setVista("categorias")}>
          Organizar categorías
        </button>
        <button className={vista === "destacados" ? "on" : ""} onClick={() => setVista("destacados")}>
          Destacar productos
        </button>
      </div>
      <div>
        <div hidden={vista !== "categorias"}>
          <Seccion titulo="Categorías">
            <ListaPaginada<any> datos={cats ?? []} nombre="categorías">{filas => (<table className="libro">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Ámbito</th>
                  <th className="der">Locales</th>
                  <th className="der">Productos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filas.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nombre}</td>
                    <td>{c.ambito === "comida" ? "Plaza de comidas" : "Tiendas"}</td>
                    <td className="der">{c.locales}</td>
                    <td className="der">{c.productos}</td>
                    <td className="der" style={{ whiteSpace: "nowrap" }}>
                      <button className="enlace" onClick={() => setEdicion({ id: c.id, nombre: c.nombre })}>
                        Renombrar
                      </button>
                      {c.locales === 0 && c.productos === 0 && (
                        <>
                          {" "}
                          ·{" "}
                          <button className="enlace" onClick={() => eliminar(c)}>
                            Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>)}</ListaPaginada>
            <form onSubmit={crear} style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24, alignItems: "end" }}>
              <label className="campo" style={{ flex: "1 1 160px", minWidth: 0 }}>
                <span>Nueva categoría</span>
                <input required value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} />
              </label>
              <label className="campo">
                <span>Ámbito</span>
                <select value={nueva.ambito} onChange={(e) => setNueva({ ...nueva, ambito: e.target.value })}>
                  <option value="tiendas">Tiendas</option>
                  <option value="comida">Plaza de comidas</option>
                </select>
              </label>
              <button className="btn">Crear</button>
            </form>
          </Seccion>
        </div>
        <div hidden={vista !== "destacados"}>
          <Guia titulo="Da visibilidad a un producto">
            Busca un producto y elige cuánto tiempo destacarlo. Al terminar ese plazo deja de aparecer como destacado.
          </Guia>
          <label className="campo" style={{ maxWidth: 240, marginBottom: 16 }}>
            <span>Duración del destacado</span>
            <select value={duracion} onChange={(e) => setDuracion(Number(e.target.value))}>
              <option value={7}>7 días</option>
              <option value={14}>14 días</option>
              <option value={30}>30 días</option>
            </select>
          </label>
          <Seccion
            titulo="Productos destacados"
            accion={
              <input
                className="entrada"
                style={{ maxWidth: 220 }}
                placeholder="Buscar producto"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            }
          >
            <ListaPaginada<any> key={q} datos={productos ?? []} nombre="productos">
              {(filas) => (
                <table className="libro">
                  <tbody>
                    {filas.map((p) => {
                      const activo = p.destacado_hasta && new Date(p.destacado_hasta) >= new Date(new Date().toDateString());
                      return (
                        <tr key={p.id}>
                          <td>
                            {p.nombre}
                            <small>
                              {p.local} · {bs(p.precio_bs)}
                            </small>
                          </td>
                          <td>{activo ? <span className="etiqueta oro">hasta {fecha(p.destacado_hasta)}</span> : null}</td>
                          <td className="der" style={{ whiteSpace: "nowrap" }}>
                            {activo ? (
                              <button className="btn chico claro" onClick={() => destacar(p, null)}>
                                Quitar
                              </button>
                            ) : (
                              <button className="btn chico" onClick={() => destacar(p, duracion)}>
                                Destacar {duracion} días
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </ListaPaginada>
          </Seccion>
        </div>
      </div>
      <PanelLateral abierto={!!edicion} titulo="Renombrar categoría" onCerrar={() => setEdicion(null)}>
        {edicion && <form onSubmit={renombrar} style={{ display: "grid", gap: 18 }}><label className="campo"><span>Nombre de la categoría</span><input required value={edicion.nombre} onChange={e => setEdicion({ ...edicion, nombre: e.target.value })} /></label><Mensajes error={a.error} /><button className="btn" disabled={a.enviando}>Guardar nombre</button></form>}
      </PanelLateral>
    </>
  );
}

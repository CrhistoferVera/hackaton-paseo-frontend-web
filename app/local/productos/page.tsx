"use client";

import { useState } from "react";
import { Cabecera, Mensajes, PanelLateral } from "@/components/marco";
import { api, urlArchivo } from "@/lib/api";
import { bs } from "@/lib/formato";
import { useAccion, useDatos } from "@/lib/use-datos";

const VACIO = { id: "", nombre: "", descripcion: "", precioBs: "", stock: "", categoriaId: "", fotoUrl: "", activo: true };

/** HU-Y13: el gerente administra el catálogo PaseoYa de su local. */
export default function Productos() {
  const { datos, recargar } = useDatos<any[]>("/local/productos");
  const { datos: categorias } = useDatos<any[]>("/recinto/categorias");
  const { datos: local } = useDatos<any>("/local/mi-local");
  const [f, setF] = useState<any | null>(null);
  const a = useAccion();

  const abrir = (p?: any) =>
    setF(
      p
        ? { id: p.id, nombre: p.nombre, descripcion: p.descripcion, precioBs: String(p.precio_bs), stock: String(p.stock), categoriaId: p.categoria_id, fotoUrl: p.foto_url ?? "", activo: p.activo }
        : { ...VACIO, categoriaId: local?.categoria_id ?? "" },
    );

  async function subirFoto(archivo: File) {
    const fd = new FormData();
    fd.append("archivo", archivo);
    const r = await a.ejecutar(() => api<{ url: string }>("/local/productos/foto", { formulario: fd }));
    if (r) setF((x: any) => ({ ...x, fotoUrl: r.url }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const cuerpo = { nombre: f.nombre, descripcion: f.descripcion, precioBs: Number(f.precioBs), stock: Number(f.stock), categoriaId: f.categoriaId, fotoUrl: f.fotoUrl || null, activo: f.activo };
    const r = await a.ejecutar(() => (f.id ? api(`/local/productos/${f.id}`, { metodo: "PATCH", cuerpo }) : api("/local/productos", { cuerpo })), "Producto guardado");
    if (r) {
      setF(null);
      void recargar();
    }
  }

  async function eliminar() {
    const r: any = await a.ejecutar(() => api(`/local/productos/${f.id}`, { metodo: "DELETE" }));
    if (r) {
      a.setExito(r.desactivado ? "El producto tiene pedidos: lo desactivamos en lugar de borrarlo." : "Producto eliminado");
      setF(null);
      void recargar();
    }
  }

  return (
    <>
      <Cabecera ceja="PaseoYa" titulo="Productos de tu local" descripcion="Lo que publiques aquí aparece en el buscador global de PaseoYa con precio, stock y ubicación.">
        <button className="btn" onClick={() => abrir()}>Nuevo producto</button>
      </Cabecera>
      <Mensajes exito={!f ? a.exito : null} />
      {!datos?.length ? (
        <div className="vacio">Todavía no publicaste productos.</div>
      ) : (
        <table className="libro">
          <thead><tr><th /><th>Producto</th><th>Categoría</th><th className="der">Precio</th><th className="der">Stock</th><th>Estado</th></tr></thead>
          <tbody>
            {datos.map((p) => (
              <tr key={p.id} className="clic" onClick={() => abrir(p)}>
                <td style={{ width: 56 }}>
                  {p.foto_url ? <img src={urlArchivo(p.foto_url)!} alt="" width={44} height={44} style={{ objectFit: "cover", borderRadius: 2 }} /> : <div style={{ width: 44, height: 44, background: "var(--veladura)" }} />}
                </td>
                <td><b style={{ fontWeight: 500 }}>{p.nombre}</b><small>{p.descripcion}</small></td>
                <td>{p.categoria}</td>
                <td className="der">{bs(p.precio_bs)}</td>
                <td className="der">{p.stock === 0 ? <span className="etiqueta alerta">Agotado</span> : p.stock}</td>
                <td>{p.activo ? <span className="etiqueta exito">Publicado</span> : <span className="etiqueta tenue">Oculto</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <PanelLateral abierto={!!f} titulo={f?.id ? "Editar producto" : "Nuevo producto"} onCerrar={() => setF(null)}>
        {f && (
          <form onSubmit={guardar} style={{ display: "grid", gap: 16 }}>
            <label className="campo"><span>Nombre</span><input required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
            <label className="campo"><span>Descripción</span><textarea rows={2} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></label>
            <div className="fila-campos">
              <label className="campo"><span>Precio (Bs)</span><input required type="number" min="0.5" step="0.5" value={f.precioBs} onChange={(e) => setF({ ...f, precioBs: e.target.value })} /></label>
              <label className="campo"><span>Stock</span><input required type="number" min="0" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /></label>
            </div>
            <label className="campo">
              <span>Categoría</span>
              <select required value={f.categoriaId} onChange={(e) => setF({ ...f, categoriaId: e.target.value })}>
                <option value="">Elige…</option>
                {categorias?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </label>
            <label className="campo">
              <span>Foto</span>
              {f.fotoUrl && <img src={urlArchivo(f.fotoUrl)!} alt="" style={{ width: 120, height: 120, objectFit: "cover" }} />}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && subirFoto(e.target.files[0])} />
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} /> Publicado en PaseoYa
            </label>
            <Mensajes error={a.error} />
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
              <button className="btn" disabled={a.enviando}>Guardar</button>
              {f.id && <button type="button" className="btn claro" onClick={eliminar}>Eliminar</button>}
            </div>
          </form>
        )}
      </PanelLateral>
    </>
  );
}

"use client";
import Image from "next/image";
import { api, urlArchivo } from "@/lib/api";
import { useState } from "react";
export interface Opcion { id?: string; nombre: string; stock: number; precioBs: number | null; fotoUrl: string | null }
export interface Grupo { id?: string; titulo: string; opciones: Opcion[] }
export function VariantesProducto({ grupos, onChange, onSubiendo }: { grupos: Grupo[]; onChange: (g: Grupo[]) => void; onSubiendo: (v: boolean) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  function grupo(i: number, patch: Partial<Grupo>) { onChange(grupos.map((g,k) => k===i ? {...g,...patch} : g)); }
  function opcion(i: number, j: number, patch: Partial<Opcion>) { grupo(i,{opciones:grupos[i].opciones.map((v,k) => k===j ? {...v,...patch} : v)}); }
  async function foto(i: number,j: number,archivo: File) {
    setSubiendo(true); onSubiendo(true); setError(null);
    try {
      const fd = new FormData(); fd.append('archivo',archivo);
      const r = await api<{url:string}>('/local/productos/foto',{formulario:fd});
      opcion(i,j,{fotoUrl:r.url});
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo subir la imagen'); }
    finally { setSubiendo(false); onSubiendo(false); }
  }
  return <fieldset disabled={subiendo} style={{border:'1px solid var(--linea)',padding:12,display:'grid',gap:12}}>
    <legend>Variantes del Producto</legend>
    <p className="muted">El cliente elige una opción por título. Precio vacío hereda el precio base; con varios títulos se suman las diferencias respecto al precio base.</p>
    {grupos.map((g,i) => <fieldset key={g.id ?? i} style={{display:'grid',gap:8,border:'1px solid var(--linea)',padding:10}}>
      <label className="campo"><span>Título de la variante</span><input required maxLength={80} value={g.titulo} placeholder="Talla, Color, Sabor" onChange={e => grupo(i,{titulo:e.target.value})} /></label>
      {g.opciones.map((v,j) => <div key={v.id ?? j} style={{borderTop:'1px solid var(--linea)',paddingTop:8,display:'grid',gap:8}}>
        <label className="campo"><span>Nombre de la opción</span><input required maxLength={80} value={v.nombre} onChange={e => opcion(i,j,{nombre:e.target.value})} /></label>
        <div className="fila-campos">
          <label className="campo"><span>Stock</span><input required type="number" min="0" step="1" value={v.stock} onChange={e => opcion(i,j,{stock:Number(e.target.value)})} /></label>
          <label className="campo"><span>Precio (Bs, opcional)</span><input type="number" min="0" step="0.01" value={v.precioBs ?? ''} placeholder="Precio base" onChange={e => opcion(i,j,{precioBs:e.target.value==='' ? null : Number(e.target.value)})} /></label>
        </div>
        {v.fotoUrl && <Image unoptimized src={urlArchivo(v.fotoUrl)!} alt={v.nombre || 'Variante'} width={72} height={72} style={{objectFit:'cover'}} />}
        <label className="campo"><span>Imagen de la variante (opcional)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const archivo=e.target.files?.[0]; if(archivo) void foto(i,j,archivo); }} /></label>
        {v.fotoUrl && <button type="button" className="enlace" onClick={() => opcion(i,j,{fotoUrl:null})}>Quitar imagen</button>}
        <button type="button" className="enlace" disabled={g.opciones.length===1} onClick={() => grupo(i,{opciones:g.opciones.filter((_,k) => k!==j)})}>Quitar opción</button>
      </div>)}
      <button type="button" className="btn claro" onClick={() => grupo(i,{opciones:[...g.opciones,{nombre:'',stock:0,precioBs:null,fotoUrl:null}]})}>Agregar opción</button>
      <button type="button" className="enlace" onClick={() => onChange(grupos.filter((_,k) => k!==i))}>Quitar grupo</button>
    </fieldset>)}
    <button type="button" className="btn claro" onClick={() => onChange([...grupos,{titulo:'',opciones:[{nombre:'',stock:0,precioBs:null,fotoUrl:null}]}])}>Agregar título de variante</button>
    {subiendo && <p role="status">Subiendo imagen…</p>}
    {error && <p role="alert">{error}</p>}
  </fieldset>;
}

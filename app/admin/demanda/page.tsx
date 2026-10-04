"use client";
import { useState } from "react";
import { Barras } from "@/components/graficos";
import { Cabecera, Cargando, Indicador, Mensajes, Seccion } from "@/components/marco";
import { ListaPaginada, Guia } from "@/components/admin-ui";
import { fecha, entero } from "@/lib/formato";
import { useDatos } from "@/lib/use-datos";
export default function Demanda() {
  const { datos, error } = useDatos<any[]>("/admin/inteligencia/demanda?dias=90");
  const [q, setQ] = useState("");
  const [canal, setCanal] = useState("todos");
  const lista = (datos ?? [])
    .filter((d) => d.termino.toLowerCase().includes(q.toLowerCase()) && (canal === "todos" || Number(d[canal]) > 0))
    .sort((a, b) => Number(b.veces) - Number(a.veces));
  return (
    <>
      <Cabecera
        ceja="Oportunidades · últimos 90 días"
        titulo="Demanda insatisfecha"
        descripcion="Descubre qué buscan los visitantes y todavía no encuentran."
      />
      <Mensajes error={error} />
      {!datos ? (
        <Cargando />
      ) : (
        <>
          <div className="indicadores">
            <Indicador etiqueta="Búsquedas sin resultado" valor={entero(datos.reduce((n, d) => n + Number(d.veces), 0))} />
            <Indicador etiqueta="Términos diferentes" valor={datos.length} />
            <Indicador
              etiqueta="Lo más buscado"
              valor={[...datos].sort((a, b) => b.veces - a.veces)[0]?.termino ?? "Sin datos"}
              oro
            />
          </div>
          <Guia titulo="De la búsqueda a una oportunidad">
            Estos términos pueden revelar oferta faltante o productos difíciles de encontrar. Revisa primero el catálogo antes de
            proponer un nuevo local.
          </Guia>
          <Seccion titulo="Las 8 necesidades más frecuentes">
            {lista.length ? (
              <Barras datos={lista.slice(0, 8)} x="termino" y="veces" alto={240} color="#f4b41a" />
            ) : (
              <p>No hay búsquedas que coincidan.</p>
            )}
          </Seccion>
          <div className="admin-toolbar">
            <label className="campo">
              <span>Buscar término</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej. zapatos" />
            </label>
            <label className="campo">
              <span>Canal con búsquedas</span>
              <select value={canal} onChange={(e) => setCanal(e.target.value)}>
                <option value="todos">Todos los canales</option>
                <option value="app">App</option>
                <option value="jarvis">Jarvis</option>
                <option value="paseoya">PaseoYa</option>
              </select>
            </label>
          </div>
          <ListaPaginada<any> key={q + canal} datos={lista} nombre="términos">
            {(filas) => (
              <table className="libro">
                <thead>
                  <tr>
                    <th>Búsqueda</th>
                    <th>Total</th>
                    <th>App</th>
                    <th>Jarvis</th>
                    <th>PaseoYa</th>
                    <th>Última búsqueda</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((d) => (
                    <tr key={d.termino}>
                      <td>
                        <b>{d.termino}</b>
                      </td>
                      <td>{d.veces}</td>
                      <td>{d.app}</td>
                      <td>{d.jarvis}</td>
                      <td>{d.paseoya}</td>
                      <td>{fecha(d.ultima)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ListaPaginada>
        </>
      )}
    </>
  );
}

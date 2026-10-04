"use client";

import { Guia, ListaPaginada, Desplegable } from "@/components/admin-ui";
import { useState } from "react";
import { Cabecera, Cargando, Indicador, Mensajes, PanelLateral } from "@/components/marco";
import { api } from "@/lib/api";
import { diasAtrasIso, entero, fecha, hoyIso } from "@/lib/formato";
import { useAccion, useDatos } from "@/lib/use-datos";

const PLANTILLAS: Record<string, string> = {
  locales_distintos: "Visitar N locales distintos (de una categoría)",
  compras_categoria: "Hacer N compras (de una categoría)",
  franja_horaria: "Comprar N veces en una franja horaria",
  primera_visita: "Descubrir N locales nuevos",
  local_especifico: "Comprar en un local específico",
};

/** HU-A05: constructor de misiones por plantilla, con segmento objetivo y vigencia. */
export default function Misiones() {
  const { datos, recargar } = useDatos<any[]>("/admin/misiones");
  const { datos: ia } = useDatos<any>("/admin/misiones/ia");
  const { datos: categorias } = useDatos<any[]>("/recinto/categorias");
  const { datos: segmentos } = useDatos<any[]>("/admin/inteligencia/segmentos");
  const { datos: plano } = useDatos<any>("/recinto/plano");
  const [f, setF] = useState<any | null>(null);
  const a = useAccion();
  const [estado, setEstado] = useState("activas");

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const regla: any = {};
    if (f.plantilla !== "local_especifico") regla.n = Number(f.n);
    if (["locales_distintos", "compras_categoria", "franja_horaria"].includes(f.plantilla) && f.categoria)
      regla.categoria = f.categoria;
    if (f.plantilla === "franja_horaria") Object.assign(regla, { desde: f.desde, hasta: f.hasta });
    if (f.plantilla === "local_especifico") Object.assign(regla, { localId: f.localId, montoMin: Number(f.montoMin || 0) });
    const r = await a.ejecutar(
      () =>
        api("/admin/misiones", {
          cuerpo: {
            nombre: f.nombre,
            descripcion: f.descripcion,
            plantilla: f.plantilla,
            regla,
            recompensaPuntos: Number(f.puntos),
            segmentoId: f.segmentoId || null,
            vigenciaDesde: f.desde_f,
            vigenciaHasta: f.hasta_f,
          },
        }),
      "Misión publicada",
    );
    if (r) {
      setF(null);
      void recargar();
    }
  }

  async function alternar(m: any) {
    await a.ejecutar(() => api(`/admin/misiones/${m.id}/activa`, { cuerpo: { activa: !m.activa } }));
    void recargar();
  }

  return (
    <>
      <Cabecera
        ceja="Programa"
        titulo="Misiones"
        descripcion="Además de estas misiones generales, la IA crea una misión personal por cliente: le propone un local de su categoría favorita que todavía no visitó."
      >
        <button
          className="btn"
          onClick={() =>
            setF({
              nombre: "",
              descripcion: "",
              plantilla: "locales_distintos",
              n: 3,
              categoria: "",
              desde: "15:00",
              hasta: "18:00",
              localId: "",
              montoMin: 0,
              puntos: 200,
              segmentoId: "",
              desde_f: hoyIso(),
              hasta_f: diasAtrasIso(-30),
            })
          }
        >
          Nueva misión
        </button>
      </Cabecera>
      {ia && (
        <div className="indicadores" style={{ marginBottom: 20 }}>
          <Indicador etiqueta="Misiones personales generadas por IA" valor={entero(ia.generadas)} />
          <Indicador etiqueta="Completadas" valor={entero(ia.completadas)} />
          <Indicador etiqueta="Puntos entregados" valor={entero(ia.puntos)} oro />
        </div>
      )}
      <div className="segmentado" style={{ marginBottom: 20 }}>
        {[
          ["activas", "Activas"],
          ["pausadas", "Pausadas"],
          ["todas", "Todas"],
        ].map(([v, t]) => (
          <button key={v} className={estado === v ? "on" : ""} onClick={() => setEstado(v)}>
            {t}
          </button>
        ))}
      </div>
      <Mensajes exito={!f ? a.exito : null} error={!f ? a.error : null} />
      {!datos ? (
        <Cargando />
      ) : (
        <ListaPaginada<any>
          key={estado}
          datos={datos.filter((m) => estado === "todas" || (estado === "activas" ? m.activa : !m.activa))}
          nombre="misiones"
        >
          {(filas) => (
            <table className="libro">
              <thead><tr><th>Misión y objetivo</th><th>Premio</th><th>Participación</th><th>Vigencia</th><th>Estado</th><th /></tr></thead>
              <tbody>{filas.map(m => <tr key={m.id}>
                <td><strong>{m.nombre}</strong><small>{m.descripcion}</small><small>{PLANTILLAS[m.plantilla]}</small></td>
                <td className="oro num">{entero(m.recompensa_puntos)} puntos</td>
                <td><strong>{entero(m.completadas)}</strong> completadas<small>{entero(m.participantes)} participantes</small></td>
                <td>{fecha(m.vigencia_desde)}<small>hasta {fecha(m.vigencia_hasta)}</small></td>
                <td><span className={m.activa ? 'etiqueta exito' : 'etiqueta'}>{m.activa ? 'Activa' : 'Pausada'}</span></td>
                <td><button className="btn chico claro" disabled={a.enviando} onClick={()=>alternar(m)}>{m.activa ? 'Pausar misión' : 'Activar misión'}</button></td>
              </tr>)}</tbody>
            </table>
          )}
        </ListaPaginada>
      )}
      <PanelLateral abierto={!!f} titulo="Nueva misión" onCerrar={() => setF(null)}>
        {f && (
          <form onSubmit={crear} style={{ display: "grid", gap: 14 }}>
            <Guia titulo="Diseña un reto fácil de entender">
              Describe una acción, elige su premio y define hasta cuándo estará disponible.
            </Guia>
            <label className="campo">
              <span>Nombre</span>
              <input
                required
                value={f.nombre}
                onChange={(e) => setF({ ...f, nombre: e.target.value })}
                placeholder="Ruta del café"
              />
            </label>
            <label className="campo">
              <span>Descripción para el cliente</span>
              <input required value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} />
            </label>
            <label className="campo">
              <span>1. ¿Qué debe hacer el cliente?</span>
              <select value={f.plantilla} onChange={(e) => setF({ ...f, plantilla: e.target.value })}>
                {Object.entries(PLANTILLAS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            {f.plantilla !== "local_especifico" && (
              <label className="campo">
                <span>Cantidad para completar el objetivo</span>
                <input type="number" min={1} max={20} value={f.n} onChange={(e) => setF({ ...f, n: e.target.value })} />
              </label>
            )}
            {["locales_distintos", "compras_categoria", "franja_horaria"].includes(f.plantilla) && (
              <label className="campo">
                <span>Categoría</span>
                <select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
                  <option value="">Cualquiera</option>
                  {categorias?.map((c) => (
                    <option key={c.id} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {f.plantilla === "franja_horaria" && (
              <div className="fila-campos">
                <label className="campo">
                  <span>Desde</span>
                  <input type="time" value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} />
                </label>
                <label className="campo">
                  <span>Hasta</span>
                  <input type="time" value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} />
                </label>
              </div>
            )}
            {f.plantilla === "local_especifico" && (
              <>
                <label className="campo">
                  <span>Local</span>
                  <select required value={f.localId} onChange={(e) => setF({ ...f, localId: e.target.value })}>
                    <option value="">Elige…</option>
                    {plano?.locales.map((l: any) => (
                      <option key={l.id} value={l.id}>
                        {l.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="campo">
                  <span>Compra mínima (Bs)</span>
                  <input type="number" min={0} value={f.montoMin} onChange={(e) => setF({ ...f, montoMin: e.target.value })} />
                </label>
              </>
            )}
            <label className="campo">
              <span>2. Premio al completar (puntos)</span>
              <input type="number" min={1} value={f.puntos} onChange={(e) => setF({ ...f, puntos: e.target.value })} />
            </label>
            <Desplegable titulo="Público objetivo (opcional)">
              {" "}
              <label className="campo">
                <span>Segmento objetivo</span>
                <select value={f.segmentoId} onChange={(e) => setF({ ...f, segmentoId: e.target.value })}>
                  <option value="">Todos los clientes</option>
                  {segmentos?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.tamano})
                    </option>
                  ))}
                </select>
              </label>
            </Desplegable>
            <div className="fila-campos">
              <label className="campo">
                <span>Inicio</span>
                <input type="date" value={f.desde_f} onChange={(e) => setF({ ...f, desde_f: e.target.value })} />
              </label>
              <label className="campo">
                <span>Fin</span>
                <input type="date" value={f.hasta_f} onChange={(e) => setF({ ...f, hasta_f: e.target.value })} />
              </label>
            </div>
            <Mensajes error={a.error} />
            <button className="btn" disabled={a.enviando}>
              Publicar misión
            </button>
          </form>
        )}
      </PanelLateral>
    </>
  );
}

"use client";

import { Guia, Desplegable } from "@/components/admin-ui";
import { useEffect, useState } from "react";
import { Linea } from "@/components/graficos";
import { Cabecera, Cargando, Indicador, Mensajes, Seccion } from "@/components/marco";
import { api } from "@/lib/api";
import { entero, pct } from "@/lib/formato";
import { useSesion } from "@/lib/sesion";
import { useAccion, useDatos } from "@/lib/use-datos";

const lecturaGini = (g: number) => (g < 0.3 ? "parejo" : g < 0.45 ? "moderado" : "concentrado");

/**
 * Ofertas personales de la IA y equidad del flujo. Cada mañana la IA genera ofertas por cliente
 * (gusto + equidad) con cupo por local y en sus horas flojas; aquí se mide cómo se reparte el público
 * entre locales (Gini) y cuánto rinden las ofertas, y se ajusta el peso de la equidad.
 */
export default function OfertasIA() {
  const { usuario } = useSesion();
  const { datos: r, recargar } = useDatos<any>("/admin/ofertas");
  const { datos: eq, recargar: recargarEq } = useDatos<any>("/admin/equidad");
  const a = useAccion();
  const [aj, setAj] = useState<any | null>(null);
  useEffect(() => {
    if (r?.ajustes) setAj(r.ajustes);
  }, [r?.ajustes]);
  const puedeEditar = usuario?.rol !== "analista";

  async function generar() {
    if (!confirm("¿Regenerar las ofertas de hoy? Se reemplazan las que aún no se usaron.")) return;
    const x = await a.ejecutar(
      () => api<any>("/admin/ofertas/generar", { cuerpo: { forzar: true } }),
      (d: any) => `Generadas ${entero(d.generadas)} ofertas para ${entero(d.clientes)} clientes en ${d.segundos} s`,
    );
    if (x) {
      void recargar();
      void recargarEq();
    }
  }

  async function guardar() {
    const x = await a.ejecutar(
      () =>
        api("/admin/ofertas/ajustes", {
          metodo: "PUT",
          cuerpo: {
            ofertas_activas: aj.ofertas_activas,
            ofertas_por_cliente: Number(aj.ofertas_por_cliente),
            multiplicador_max: Number(aj.multiplicador_max),
            peso_equidad: Number(aj.peso_equidad),
            hora_generacion: Number(aj.hora_generacion),
          },
        }),
      "Ajustes guardados: se aplican desde la próxima generación (o regenera ahora).",
    );
    if (x) void recargar();
  }

  if (!r || !eq) return <Cargando />;
  const usoSemana =
    r.serie.reduce((s: number, d: any) => s + d.usadas, 0) /
    Math.max(
      1,
      r.serie.reduce((s: number, d: any) => s + d.ofertas, 0),
    );

  return (
    <>
      <Cabecera
        ceja="Centro de Inteligencia"
        titulo="Ofertas IA y equidad"
        descripcion="Ofertas para cada cliente y reparto de visitas entre comercios. Comprueba su uso y ajusta a qué locales dar más visibilidad."
      >
        {puedeEditar && (
          <button className="btn" onClick={() => void generar()} disabled={a.enviando}>
            Regenerar ofertas de hoy
          </button>
        )}
      </Cabecera>
      <Mensajes error={a.error} exito={a.exito} />

      <Guia titulo="Dos preguntas, una misma vista">
        ¿Las ofertas se usan? Mira la participación. ¿Llegan visitas a más locales? Mira el reparto del público. Los ajustes están
        al final y solo se aplican cuando los guardas.
      </Guia>
      <div className="indicadores">
        <Indicador
          etiqueta="Reparto de visitas · 7 días"
          valor={lecturaGini(eq.giniFlujo)}
          detalle={"Índice de concentración: " + eq.giniFlujo.toFixed(2) + " · cuanto menor, más parejo"}
          oro
        />
        <Indicador
          etiqueta="Concentración de recomendaciones"
          valor={eq.giniExposicion.toFixed(2)}
          detalle="Cuán repartidas están las recomendaciones de Jarvis y las ofertas"
        />
        <Indicador
          etiqueta="Ofertas de hoy"
          valor={entero(r.hoy.ofertas)}
          detalle={`${entero(r.hoy.clientes)} clientes · ${entero(r.hoy.locales)} locales`}
        />
        <Indicador
          etiqueta="Uso en 14 días"
          valor={pct(usoSemana * 100)}
          detalle={`${entero(r.hoy.usadas)} usadas hoy · ${entero(r.hoy.puntos_bono)} pts extra`}
        />
      </div>

      <div className="dos-col">
        <Seccion titulo="Equidad del flujo en el tiempo">
          <Linea
            datos={eq.serie}
            x="fecha"
            series={[{ clave: "gini", color: "#f4b41a", nombre: "Gini entre locales" }]}
            formato={(v) => v.toFixed(2)}
          />
          <p className="muted" style={{ fontSize: 13 }}>
            Si la curva baja, el público se está repartiendo mejor entre los locales.
          </p>
        </Seccion>
        <Seccion titulo="Ofertas generadas y usadas">
          <Linea
            datos={r.serie}
            x="fecha"
            series={[
              { clave: "ofertas", color: "#a3a3a3", nombre: "Generadas" },
              { clave: "usadas", color: "#f4b41a", nombre: "Usadas" },
            ]}
            formato={(v) => entero(v)}
          />
        </Seccion>
      </div>

      <div className="dos-col">
        <Seccion titulo="Locales que necesitan más visibilidad">
          {!eq.subatendidos.length ? (
            <div className="vacio">Ningún local está claramente por debajo de sus competidores.</div>
          ) : (
            <table className="libro">
              <thead>
                <tr>
                  <th>Local</th>
                  <th>Categoría</th>
                  <th className="der">Visitas 7 d</th>
                  <th className="der">Déficit</th>
                  <th className="der">Recomendado</th>
                </tr>
              </thead>
              <tbody>
                {eq.subatendidos.map((l: any) => (
                  <tr key={l.id}>
                    <td>{l.local}</td>
                    <td>{l.categoria}</td>
                    <td className="der">{entero(l.visitas7)}</td>
                    <td className="der oro">{Math.round(l.deficit * 100)} %</td>
                    <td className="der">{entero(l.exposicion7)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Seccion>
        <Seccion titulo="Locales con mayor concentración de visitas">
          {!eq.sobreatendidos.length ? (
            <div className="vacio">Ninguno está muy por encima de su categoría.</div>
          ) : (
            <table className="libro">
              <thead>
                <tr>
                  <th>Local</th>
                  <th>Categoría</th>
                  <th className="der">Visitas 7 d</th>
                  <th className="der">Exceso</th>
                  <th className="der">Recomendado</th>
                </tr>
              </thead>
              <tbody>
                {eq.sobreatendidos.map((l: any) => (
                  <tr key={l.id}>
                    <td>{l.local}</td>
                    <td>{l.categoria}</td>
                    <td className="der">{entero(l.visitas7)}</td>
                    <td className="der">{Math.round(-l.deficit * 100)} %</td>
                    <td className="der">{entero(l.exposicion7)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Seccion>
      </div>

      <div className="dos-col">
        <Seccion titulo="Ofertas por local (7 días)">
          <table className="libro">
            <thead>
              <tr>
                <th>Local</th>
                <th className="der">Ofertas</th>
                <th className="der">Usadas</th>
                <th className="der">Uso</th>
                <th className="der">Equidad</th>
              </tr>
            </thead>
            <tbody>
              {r.porLocal.map((l: any) => (
                <tr key={l.local}>
                  <td>
                    {l.local}
                    <small>{l.categoria}</small>
                  </td>
                  <td className="der">{entero(l.ofertas)}</td>
                  <td className="der">{entero(l.usadas)}</td>
                  <td className="der">{pct(l.tasa)}</td>
                  <td className="der">{Number(l.equidad).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Seccion>
        <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
          {aj && (
            <Desplegable titulo="Configurar cómo recomienda la IA">
              <div style={{ display: "grid", gap: 14 }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    disabled={!puedeEditar}
                    checked={aj.ofertas_activas}
                    onChange={(e) => setAj({ ...aj, ofertas_activas: e.target.checked })}
                  />{" "}
                  Generar ofertas cada mañana
                </label>
                <label className="campo">
                  <span>Peso de la equidad · {Math.round(Number(aj.peso_equidad) * 100)} %</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    disabled={!puedeEditar}
                    value={aj.peso_equidad}
                    onChange={(e) => setAj({ ...aj, peso_equidad: e.target.value })}
                  />
                  <small className="muted">
                    0 % = solo lo que le gusta al cliente · 100 % = solo repartir el flujo. Lo usan las ofertas y las
                    recomendaciones de Jarvis.
                  </small>
                </label>
                <div className="fila-campos">
                  <label className="campo">
                    <span>Ofertas por cliente</span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      disabled={!puedeEditar}
                      value={aj.ofertas_por_cliente}
                      onChange={(e) => setAj({ ...aj, ofertas_por_cliente: e.target.value })}
                    />
                  </label>
                  <label className="campo">
                    <span>Multiplicador máximo</span>
                    <input
                      type="number"
                      min="1.5"
                      max="5"
                      step="0.5"
                      disabled={!puedeEditar}
                      value={aj.multiplicador_max}
                      onChange={(e) => setAj({ ...aj, multiplicador_max: e.target.value })}
                    />
                  </label>
                  <label className="campo">
                    <span>Hora de generación</span>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      disabled={!puedeEditar}
                      value={aj.hora_generacion}
                      onChange={(e) => setAj({ ...aj, hora_generacion: e.target.value })}
                    />
                  </label>
                </div>
                {puedeEditar && (
                  <button className="btn claro" onClick={() => void guardar()} disabled={a.enviando}>
                    Guardar ajustes
                  </button>
                )}
                <small className="muted">Última generación: {r.ajustes.ultima_generacion ?? "—"}</small>
              </div>
            </Desplegable>
          )}
          <Seccion titulo="Ejemplos de hoy">
            {r.ejemplo.map((o: any, i: number) => (
              <div key={i} style={{ borderTop: "1px solid var(--linea)", padding: "8px 0" }}>
                <b style={{ fontWeight: 500 }}>{o.titulo}</b>{" "}
                <span className="muted">
                  · {o.hora_inicio.slice(0, 5)}–{o.hora_fin.slice(0, 5)}
                </span>
                <p style={{ margin: "2px 0 0", fontSize: 13 }}>{o.motivo}</p>
              </div>
            ))}
          </Seccion>
        </div>
      </div>
    </>
  );
}

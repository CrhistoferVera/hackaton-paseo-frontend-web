"use client";

import { Guia, Desplegable, ListaPaginada } from "@/components/admin-ui";
import { useState } from "react";
import { Cabecera, Cargando, Mensajes, PanelLateral } from "@/components/marco";
import { api } from "@/lib/api";
import { bs, fechaHora, REGLA_FRAUDE } from "@/lib/formato";
import { useSesion } from "@/lib/sesion";
import { useTiempoReal } from "@/lib/tiempo-real";
import { useAccion, useDatos } from "@/lib/use-datos";

/** HU-A14: alertas por reglas + puntaje del modelo de anomalías; estados abierta, descartada, confirmada. */
export default function Fraude() {
  const { usuario } = useSesion();
  const [estado, setEstado] = useState("abierta");
  const { datos, recargar } = useDatos<any[]>(`/admin/fraude/alertas${estado ? `?estado=${estado}` : ""}`);
  const { datos: modelo, recargar: recargarModelo } = useDatos<any>("/admin/fraude/modelo");
  const a = useAccion();
  const [seleccion, setSeleccion] = useState<any | null>(null);
  useTiempoReal({ alerta: () => void recargar() });

  async function resolver(id: string, e: "descartada" | "confirmada") {
    const r = await a.ejecutar(
      () => api(`/admin/fraude/alertas/${id}`, { cuerpo: { estado: e } }),
      e === "confirmada" ? "Confirmada: la compra se anuló y sus puntos se descontaron." : "Alerta descartada",
    );
    if (r) {
      setSeleccion(null);
      void recargar();
    }
  }

  return (
    <>
      <Cabecera
        ceja="¿Puedo confiar en los datos y en los puntos?"
        titulo="Alertas de fraude"
        descripcion="Las reglas se evalúan al registrar cada compra. El modelo de anomalías ordena la revisión."
      >
        <div className="segmentado">
          {[
            ["abierta", "Abiertas"],
            ["confirmada", "Confirmadas"],
            ["descartada", "Descartadas"],
            ["", "Todas"],
          ].map(([v, t]) => (
            <button key={v} className={estado === v ? "on" : ""} onClick={() => setEstado(v)}>
              {t}
            </button>
          ))}
        </div>
      </Cabecera>
      <Guia titulo="Una alerta es una señal, no una conclusión">
        Revisa el motivo, el monto y las personas involucradas antes de decidir. Confirmar anula la compra y revierte sus puntos;
        descartar conserva la operación.
      </Guia>
      {modelo && (
        <Desplegable titulo="Información técnica del detector">
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            {modelo.algoritmo} · {modelo.muestras} transacciones · entrenado {fechaHora(modelo.entrenadoEn)}{" "}
            <button
              className="enlace"
              onClick={() =>
                a.ejecutar(async () => {
                  await api("/admin/fraude/modelo/entrenar", { cuerpo: {} });
                  await recargarModelo();
                }, "Modelo reentrenado")
              }
            >
              Reentrenar
            </button>
          </p>
        </Desplegable>
      )}
      <Mensajes error={a.error} exito={a.exito} />
      {!datos ? (
        <Cargando />
      ) : !datos.length ? (
        <div className="vacio">No hay alertas en este estado.</div>
      ) : (
        <div className="tabla-envoltura">
          <ListaPaginada<any> key={estado} datos={datos} nombre="alertas">
            {(filas) => (
              <table className="libro">
                <thead>
                  <tr>
                    <th>Prioridad de revisión</th>
                    <th>Regla</th>
                    <th>Detalle</th>
                    <th>Comercio</th>
                    <th>Cliente</th>
                    <th className="der">Monto</th>
                    <th>Fecha</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filas.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            className="num"
                            style={{ color: x.puntaje >= 0.85 ? "var(--alerta)" : undefined, fontWeight: 600 }}
                          >
                            {x.puntaje >= 0.85 ? "Alta" : "Revisar"}
                          </span>
                          <span className="barra" style={{ width: 50 }}>
                            <i
                              style={{
                                width: `${x.puntaje * 100}%`,
                                background: x.puntaje >= 0.85 ? "var(--alerta)" : "var(--tinta)",
                              }}
                            />
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="etiqueta alerta">{REGLA_FRAUDE[x.regla] ?? x.regla}</span>
                      </td>
                      <td style={{ maxWidth: 340 }}>{x.detalle}</td>
                      <td>{x.local ?? "—"}</td>
                      <td>{x.cliente ?? "—"}</td>
                      <td className="der">{x.monto_bs ? bs(x.monto_bs) : "—"}</td>
                      <td className="num">{fechaHora(x.creado_en)}</td>
                      <td className="der">
                        {x.estado === "abierta" && usuario?.rol === "admin" ? (
                          <button
                            className="btn chico claro"
                            onClick={() => {
                              a.setError(null);
                              setSeleccion(x);
                            }}
                          >
                            Revisar evidencia
                          </button>
                        ) : (
                          <span
                            className={`etiqueta ${x.estado === "confirmada" ? "alerta" : x.estado === "descartada" ? "tenue" : ""}`}
                          >
                            {x.estado}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ListaPaginada>
        </div>
      )}
      <PanelLateral abierto={!!seleccion} titulo="Revisar alerta" onCerrar={() => setSeleccion(null)}>
        {seleccion && (
          <>
            <span className="etiqueta alerta">{REGLA_FRAUDE[seleccion.regla] ?? seleccion.regla}</span>
            <h3>Motivo de la alerta</h3>
            <p>{seleccion.detalle}</p>
            <dl>
              <dt>Comercio</dt>
              <dd>{seleccion.local ?? "No disponible"}</dd>
              <dt>Cliente</dt>
              <dd>{seleccion.cliente ?? "No disponible"}</dd>
              <dt>Monto</dt>
              <dd>{seleccion.monto_bs != null ? bs(seleccion.monto_bs) : "No disponible"}</dd>
              <dt>Fecha</dt>
              <dd>{fechaHora(seleccion.creado_en)}</dd>
              <dt>Identificador de transacción</dt>
              <dd style={{ overflowWrap: "anywhere" }}>{seleccion.transaccion_id ?? "Sin compra asociada"}</dd>
            </dl>
            <Guia titulo="Antes de resolver">
              Contrasta esta información con el comprobante del comercio. El puntaje del detector no es una probabilidad de
              fraude.
            </Guia>
            <Mensajes error={a.error} />
            <div className="admin-toolbar">
              <button className="btn claro" disabled={a.enviando} onClick={() => resolver(seleccion.id, "descartada")}>
                Descartar alerta
              </button>
              {seleccion.transaccion_id && (
                <button className="btn peligro" disabled={a.enviando} onClick={() => resolver(seleccion.id, "confirmada")}>
                  Confirmar fraude y anular compra
                </button>
              )}
            </div>
          </>
        )}
      </PanelLateral>
    </>
  );
}

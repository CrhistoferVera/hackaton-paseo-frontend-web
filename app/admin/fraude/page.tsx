"use client";

import { useState } from "react";
import { Cabecera, Cargando, Mensajes } from "@/components/marco";
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
  useTiempoReal({ alerta: () => void recargar() });

  async function resolver(id: string, e: "descartada" | "confirmada") {
    const r = await a.ejecutar(() => api(`/admin/fraude/alertas/${id}`, { cuerpo: { estado: e } }), e === "confirmada" ? "Confirmada: la compra se anuló y sus puntos se descontaron." : "Alerta descartada");
    if (r) void recargar();
  }

  return (
    <>
      <Cabecera ceja="¿Puedo confiar en los datos y en los puntos?" titulo="Alertas de fraude" descripcion="Las reglas se evalúan al registrar cada compra. El modelo de anomalías ordena la revisión.">
        <div className="segmentado">
          {[["abierta", "Abiertas"], ["confirmada", "Confirmadas"], ["descartada", "Descartadas"], ["", "Todas"]].map(([v, t]) => <button key={v} className={estado === v ? "on" : ""} onClick={() => setEstado(v)}>{t}</button>)}
        </div>
      </Cabecera>
      {modelo && (
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
          {modelo.algoritmo} · {modelo.muestras} transacciones · entrenado {fechaHora(modelo.entrenadoEn)}{" "}
          <button className="enlace" onClick={() => a.ejecutar(async () => { await api("/admin/fraude/modelo/entrenar", { cuerpo: {} }); await recargarModelo(); }, "Modelo reentrenado")}>Reentrenar</button>
        </p>
      )}
      <Mensajes error={a.error} exito={a.exito} />
      {!datos ? <Cargando /> : !datos.length ? <div className="vacio">No hay alertas en este estado.</div> : (
        <div className="tabla-envoltura">
          <table className="libro">
            <thead><tr><th>Puntaje</th><th>Regla</th><th>Detalle</th><th>Comercio</th><th>Cliente</th><th className="der">Monto</th><th>Fecha</th><th /></tr></thead>
            <tbody>
              {datos.map((x) => (
                <tr key={x.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="num" style={{ color: x.puntaje >= 0.85 ? "var(--alerta)" : undefined, fontWeight: 600 }}>{Number(x.puntaje).toFixed(2)}</span>
                      <span className="barra" style={{ width: 50 }}><i style={{ width: `${x.puntaje * 100}%`, background: x.puntaje >= 0.85 ? "var(--alerta)" : "var(--tinta)" }} /></span>
                    </div>
                  </td>
                  <td><span className="etiqueta alerta">{REGLA_FRAUDE[x.regla] ?? x.regla}</span></td>
                  <td style={{ maxWidth: 340 }}>{x.detalle}</td>
                  <td>{x.local ?? "—"}</td>
                  <td>{x.cliente ?? "—"}</td>
                  <td className="der">{x.monto_bs ? bs(x.monto_bs) : "—"}</td>
                  <td className="num">{fechaHora(x.creado_en)}</td>
                  <td className="der">
                    {x.estado === "abierta" && usuario?.rol === "admin" ? (
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button className="btn chico claro" onClick={() => resolver(x.id, "descartada")}>Descartar</button>
                        {x.transaccion_id && <button className="btn chico peligro" onClick={() => resolver(x.id, "confirmada")}>Confirmar y anular</button>}
                      </div>
                    ) : (
                      <span className={`etiqueta ${x.estado === "confirmada" ? "alerta" : x.estado === "descartada" ? "tenue" : ""}`}>{x.estado}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

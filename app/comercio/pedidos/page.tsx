"use client";

import { useCallback, useState } from "react";
import { Cabecera, Mensajes, Seccion } from "@/components/marco";
import { EscanerQR } from "@/components/escaner-qr";
import { api, urlArchivo } from "@/lib/api";
import { bs, ESTADO_PEDIDO, hora } from "@/lib/formato";
import { useTiempoReal } from "@/lib/tiempo-real";
import { useAccion, useDatos } from "@/lib/use-datos";

const SIGUIENTE: Record<string, "confirmado" | "preparando" | "listo" | undefined> = {
  recibido: "confirmado",
  confirmado: "preparando",
  preparando: "listo",
};
const ACCION: Record<string, string> = { confirmado: "Confirmar", preparando: "Preparar", listo: "Marcar listo" };

/** HU-Y14 y HU-Y15: bandeja en tiempo real y entrega con QR o PIN. */
export default function Pedidos() {
  const { datos, recargar } = useDatos<any[]>("/local/pedidos");
  const [aviso, setAviso] = useState<string | null>(null);
  const [retiro, setRetiro] = useState<any | null>(null);
  const [codigo, setCodigo] = useState("");
  const accion = useAccion();
  const retiroA = useAccion();

  useTiempoReal({
    pedido: (e: any) => {
      if (e.tipo === "cliente_llego") setAviso(`${e.cliente} llegó a retirar el pedido ${e.pedido}`);
      if (e.tipo === "nuevo") setAviso("Llegó un pedido nuevo");
      void recargar();
    },
  });

  async function avanzar(id: string, estado: string) {
    await accion.ejecutar(() => api(`/local/pedidos/${id}/estado`, { cuerpo: { estado } }));
    void recargar();
  }

  const consultar = useCallback(
    async (texto: string) => {
      retiroA.setExito(null);
      const r = await retiroA.ejecutar(() => api("/local/retiros/consultar", { cuerpo: { codigo: texto } }));
      if (r) {
        setRetiro(r);
        setCodigo(texto);
      }
    },
    [retiroA],
  );

  async function entregar() {
    const r = await retiroA.ejecutar(() => api("/local/retiros/entregar", { cuerpo: { codigo } }), (x: any) => `Entregado. El cliente sumó ${x.puntos} pts.`);
    if (r) {
      setRetiro(null);
      void recargar();
    }
  }

  const activos = (datos ?? []).filter((s) => !["entregado", "vencido"].includes(s.estado));
  const cerrados = (datos ?? []).filter((s) => ["entregado", "vencido"].includes(s.estado));

  return (
    <>
      <Cabecera ceja="PaseoYa" titulo="Pedidos para retirar" descripcion="La bandeja se actualiza sola. Cuando el cliente toca «Llegué», el pedido sube al principio." />
      {aviso && (
        <div className="aviso" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
          <span className="vivo oro">{aviso}</span>
          <button className="enlace" onClick={() => setAviso(null)}>Cerrar</button>
        </div>
      )}
      <Mensajes error={accion.error} />
      <div className="dos-col">
        <div>
          {!activos.length ? (
            <div className="vacio">No hay pedidos pendientes.</div>
          ) : (
            <table className="libro">
              <thead>
                <tr><th>Pedido</th><th>Retiro</th><th>Detalle</th><th className="der">Total</th><th>Estado</th><th /></tr>
              </thead>
              <tbody>
                {activos.map((s) => (
                  <tr key={s.id} style={s.estado === "cliente_llego" ? { background: "#f6efdd" } : undefined}>
                    <td>
                      <b className="dato">{s.pedido}</b>
                      <small>{s.cliente}</small>
                    </td>
                    <td className="num">{hora(s.franja_inicio)}–{hora(s.franja_fin)}</td>
                    <td>
                      {s.items.map((i: any) => (
                        <div key={i.nombre} style={{ fontSize: 13 }}>{i.cantidad} × {i.nombre}</div>
                      ))}
                      {s.pago === "qr_anticipado" && (
                        <small>
                          Pago anticipado por QR · {s.comprobante_url ? <a className="enlace" href={urlArchivo(s.comprobante_url)!} target="_blank">ver comprobante</a> : "sin comprobante"}
                        </small>
                      )}
                    </td>
                    <td className="der">{bs(s.total_bs)}</td>
                    <td><span className={`etiqueta ${s.estado === "cliente_llego" ? "oro" : s.estado === "listo" ? "exito" : "tenue"}`}>{ESTADO_PEDIDO[s.estado]}</span></td>
                    <td className="der">
                      {SIGUIENTE[s.estado] && (
                        <button className="btn chico" onClick={() => avanzar(s.id, SIGUIENTE[s.estado]!)} disabled={accion.enviando}>
                          {ACCION[SIGUIENTE[s.estado]!]}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div>
          <span className="senal muted">Entregar pedido</span>
          <p className="muted" style={{ fontSize: 14 }}>Escanea el QR de retiro o ingresa el PIN de 4 dígitos y confirma el nombre del cliente.</p>
          <EscanerQR onLeido={consultar} etiqueta="Escanear QR de retiro" />
          <Mensajes error={retiroA.error} exito={retiroA.exito} />
          {retiro && (
            <div className="objeto" style={{ padding: 20, marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b className="dato">{retiro.pedido}</b>
                <span className="etiqueta tenue">{retiro.etiqueta}</span>
              </div>
              <div className="display" style={{ fontSize: 26, margin: "10px 0" }}>{retiro.cliente}</div>
              {retiro.items.map((i: any) => (
                <div key={i.nombre} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, borderBottom: "1px solid var(--linea)", padding: "6px 0" }}>
                  <span>{i.cantidad} × {i.nombre}</span>
                  <span className="num">{bs(i.precio_bs * i.cantidad)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <span className="senal muted">{retiro.pago === "en_local" ? "Cobrar en el local" : "Pagado por QR"}</span>
                <b className="num">{bs(retiro.totalBs)}</b>
              </div>
              {retiro.entregable ? (
                <button className="btn grande" style={{ width: "100%", marginTop: 16 }} onClick={entregar} disabled={retiroA.enviando}>
                  Confirmar nombre y entregar
                </button>
              ) : (
                <div className="aviso" style={{ marginTop: 16 }}>Marca el pedido como listo antes de entregarlo.</div>
              )}
            </div>
          )}
        </div>
      </div>
      <Seccion titulo="Entregados y vencidos recientes">
        {!cerrados.length ? (
          <div className="vacio">Sin pedidos cerrados en los últimos 2 días.</div>
        ) : (
          <table className="libro">
            <tbody>
              {cerrados.map((s) => (
                <tr key={s.id}>
                  <td className="dato">{s.pedido}</td>
                  <td>{s.cliente}</td>
                  <td className="der">{bs(s.total_bs)}</td>
                  <td className="der oro">{s.puntos ? `+${s.puntos} pts` : ""}</td>
                  <td><span className={`etiqueta ${s.estado === "vencido" ? "alerta" : "llena"}`}>{ESTADO_PEDIDO[s.estado]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Seccion>
    </>
  );
}

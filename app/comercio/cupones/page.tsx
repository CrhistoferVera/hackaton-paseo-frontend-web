"use client";

import { useCallback, useState } from "react";
import { Cabecera, Mensajes } from "@/components/marco";
import { EscanerQR } from "@/components/escaner-qr";
import { api } from "@/lib/api";
import { fechaHora, pts } from "@/lib/formato";
import { useAccion } from "@/lib/use-datos";

/** HU-L04: validar el cupón del cliente y entregar el beneficio. */
export default function Cupones() {
  const [cupon, setCupon] = useState<any | null>(null);
  const [codigo, setCodigo] = useState("");
  const consulta = useAccion();
  const entrega = useAccion();

  const leer = useCallback(
    async (texto: string) => {
      entrega.setExito(null);
      setCupon(null);
      setCodigo("");
      const r = await consulta.ejecutar(() => api("/local/cupones/consultar", { cuerpo: { codigo: texto } }));
      if (r) {
        setCupon(r);
        setCodigo(texto);
      }
    },
    [consulta, entrega],
  );

  async function entregar() {
    const r = await entrega.ejecutar(() => api("/local/cupones/entregar", { cuerpo: { codigo } }), "Puntos canjeados. Entrega el beneficio al cliente.");
    if (r) setCupon({ ...cupon, estado: "validado", valido: false, motivo: null });
  }

  return (
    <>
      <Cabecera ceja="Mostrador" titulo="Canjear puntos" descripcion="Los puntos se descuentan recién al validar. Un cupón vencido o usado se rechaza con la hora." />
      <div className="dos-col">
        <div>
          <EscanerQR onLeido={leer} etiqueta="Escanear cupón" />
          <Mensajes error={consulta.error} />
        </div>
        <div>
          {!cupon ? (
            <div className="vacio">Escanea el QR o ingresa el código del cupón que muestra el cliente en la app.</div>
          ) : (
            <div className="objeto" style={{ padding: 24 }}>
              <span className="senal muted">Recompensa</span>
              <div className="display" style={{ fontSize: 30, margin: "6px 0" }}>{cupon.recompensa}</div>
              <p className="muted" style={{ margin: 0 }}>{cupon.descripcion}</p>
              <div className="cifra oro" style={{ fontSize: 30, margin: "16px 0" }}>{pts(cupon.costoPuntos)}</div>
              <table className="libro">
                <tbody>
                  <tr><td className="muted">Cliente</td><td className="der">{cupon.cliente}</td></tr>
                  <tr><td className="muted">Estado</td><td className="der"><span className={`etiqueta ${cupon.estado === "emitido" ? "exito" : cupon.estado === "validado" ? "llena" : "alerta"}`}>{cupon.estado}</span></td></tr>
                  <tr><td className="muted">Vence</td><td className="der">{fechaHora(cupon.expiraEn)}</td></tr>
                </tbody>
              </table>
              {cupon.motivo && <div className="aviso error" style={{ marginTop: 16 }}>{cupon.motivo}</div>}
              <Mensajes error={entrega.error} exito={entrega.exito} />
              {cupon.valido && (
                <button className="btn grande" style={{ width: "100%", marginTop: 16 }} onClick={entregar} disabled={entrega.enviando}>
                  {entrega.enviando ? "Validando…" : "Validar y entregar"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

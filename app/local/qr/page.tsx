"use client";

import { Cabecera, Mensajes } from "@/components/marco";
import { descargar } from "@/lib/api";
import { useAccion, useDatos } from "@/lib/use-datos";

/** HU-L07: QR del local para imprimir y poner en la puerta. */
export default function QrPuerta() {
  const { datos: local } = useDatos<any>("/local/mi-local");
  const a = useAccion();
  return (
    <>
      <Cabecera ceja="Mi local" titulo="QR de la puerta" descripcion="Imprímelo en A5 y colócalo a la altura de los ojos junto a la entrada. Cada cliente que lo escanea registra su visita; la primera vez gana puntos de descubrimiento." />
      <div style={{ display: "grid", gap: 16, maxWidth: 520 }}>
        {local && (
          <table className="libro">
            <tbody>
              <tr><td className="muted">Local</td><td className="der">{local.nombre}</td></tr>
              <tr><td className="muted">Ubicación</td><td className="der">{local.piso} · Sector {local.sector} · Local {local.numero_local}</td></tr>
              <tr><td className="muted">Código</td><td className="der dato">PPL:{local.codigo_puerta}</td></tr>
            </tbody>
          </table>
        )}
        <button className="btn grande" onClick={() => a.ejecutar(() => descargar("/local/qr-puerta.pdf", "qr-puerta.pdf"), "PDF descargado")}>
          Descargar PDF para imprimir
        </button>
        <Mensajes error={a.error} exito={a.exito} />
      </div>
    </>
  );
}

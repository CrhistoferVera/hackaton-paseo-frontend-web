"use client";

import { Fragment, useState } from "react";
import { Cabecera, Cargando } from "@/components/marco";
import { fechaHora } from "@/lib/formato";
import { useDatos } from "@/lib/use-datos";

/** RNF-06: toda acción sensible queda registrada con usuario, fecha y valor anterior. */
export default function Auditoria() {
  const { datos } = useDatos<any[]>("/admin/auditoria");
  const [abierto, setAbierto] = useState<string | null>(null);
  return (
    <>
      <Cabecera ceja="Confianza" titulo="Auditoría" descripcion="Cambios de reglas, anulaciones, validaciones, consentimientos y consultas en lenguaje natural." />
      {!datos ? <Cargando /> : (
        <table className="libro">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th /></tr></thead>
          <tbody>
            {datos.map((x) => (
              <Fragment key={x.id}>
                <tr className="clic" onClick={() => setAbierto(abierto === x.id ? null : x.id)}>
                  <td className="num">{fechaHora(x.creado_en)}</td>
                  <td>{x.usuario ?? "Sistema"}<small>{x.rol}</small></td>
                  <td><span className="etiqueta tenue">{x.accion.replaceAll("_", " ")}</span></td>
                  <td>{x.entidad}<small className="dato">{x.entidad_id?.slice(0, 8)}</small></td>
                  <td className="der"><span className="enlace">{abierto === x.id ? "Ocultar" : "Ver cambio"}</span></td>
                </tr>
                {abierto === x.id && (
                  <tr>
                    <td colSpan={5}>
                      <div className="dos-col">
                        <div><span className="senal muted">Antes</span><pre className="dato" style={{ fontSize: 11, whiteSpace: "pre-wrap", background: "var(--veladura)", padding: 10 }}>{JSON.stringify(x.antes, null, 2) ?? "—"}</pre></div>
                        <div><span className="senal muted">Después</span><pre className="dato" style={{ fontSize: 11, whiteSpace: "pre-wrap", background: "var(--veladura)", padding: 10 }}>{JSON.stringify(x.despues, null, 2) ?? "—"}</pre></div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

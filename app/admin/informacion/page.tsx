"use client";

import { useState } from "react";
import { Cabecera, Cargando, Mensajes, Seccion } from "@/components/marco";
import { api } from "@/lib/api";
import { fechaHora } from "@/lib/formato";
import { useAccion, useDatos } from "@/lib/use-datos";

interface Tema {
  id: string;
  tema: string;
  palabras_clave: string[];
  respuesta: string;
  activo: boolean;
  actualizado_en: string;
}

const VACIO = { id: "", tema: "", claves: "", respuesta: "", activo: true };

/**
 * Información para Jarvis: lo que el Paseo quiere que Jarvis responda sobre temas generales (medios de
 * pago, devoluciones, normas). Jarvis la dice tal cual. Lo que no está aquí ni en los datos vivos del
 * Paseo, Jarvis no lo inventa: responde que no tiene ese dato y la pregunta aparece en la lista de la derecha.
 */
export default function InformacionJarvis() {
  const { datos: temas, recargar } = useDatos<Tema[]>("/admin/info-paseo");
  const { datos: sinRespuesta } = useDatos<{ tema: string; pregunta: string; creado_en: string }[]>("/admin/info-paseo/sin-respuesta");
  const a = useAccion();
  const [f, setF] = useState(VACIO);

  function editar(t: Tema) {
    setF({ id: t.id, tema: t.tema, claves: t.palabras_clave.join(", "), respuesta: t.respuesta, activo: t.activo });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const cuerpo = { tema: f.tema, palabrasClave: f.claves.split(",").map((x) => x.trim()).filter(Boolean), respuesta: f.respuesta, activo: f.activo };
    const r = await a.ejecutar(
      () => (f.id ? api(`/admin/info-paseo/${f.id}`, { metodo: "PUT", cuerpo }) : api("/admin/info-paseo", { cuerpo })),
      f.id ? "Tema actualizado: Jarvis ya lo usa." : "Tema creado: Jarvis ya lo usa.",
    );
    if (r) {
      setF(VACIO);
      void recargar();
    }
  }

  async function borrar(t: Tema) {
    if (!confirm(`¿Borrar «${t.tema}»? Jarvis dejará de responder sobre esto.`)) return;
    const r = await a.ejecutar(() => api(`/admin/info-paseo/${t.id}`, { metodo: "DELETE" }), "Tema borrado");
    if (r) {
      if (f.id === t.id) setF(VACIO);
      void recargar();
    }
  }

  // Lo que más preguntaron sin respuesta, agrupado por tema
  const agrupado = Object.values(
    (sinRespuesta ?? []).reduce<Record<string, { tema: string; veces: number; ejemplo: string; ultima: string }>>((acc, x) => {
      const k = (x.tema || x.pregunta).toLowerCase();
      acc[k] ??= { tema: x.tema || x.pregunta, veces: 0, ejemplo: x.pregunta, ultima: x.creado_en };
      acc[k].veces++;
      return acc;
    }, {}),
  ).sort((p, q) => q.veces - p.veces);

  return (
    <>
      <Cabecera
        ceja="Centro de Inteligencia"
        titulo="Información para Jarvis"
        descripcion="Jarvis responde con los datos vivos del Paseo (locales, productos, precios, horarios, promociones, eventos, servicios) y con lo que cargues aquí. Si algo no está en ninguno de los dos, no lo inventa: le dice al cliente que no tiene ese dato y la pregunta aparece en la lista de la derecha para que la completes."
      />
      <Mensajes error={a.error} exito={a.exito} />
      <div className="dos-col">
        <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
          <Seccion titulo={f.id ? "Editar tema" : "Nuevo tema"}>
            <form onSubmit={guardar} style={{ display: "grid", gap: 14 }}>
              <label className="campo">
                <span>Tema</span>
                <input required minLength={3} maxLength={80} value={f.tema} onChange={(e) => setF({ ...f, tema: e.target.value })} placeholder="Medios de pago" />
              </label>
              <label className="campo">
                <span>Cómo lo preguntan (separado por comas)</span>
                <input required value={f.claves} onChange={(e) => setF({ ...f, claves: e.target.value })} placeholder="tarjeta de crédito, efectivo, pago con qr, aceptan" />
                <small className="muted">Jarvis usa esta respuesta cuando la pregunta contiene una de estas palabras o frases.</small>
              </label>
              <label className="campo">
                <span>Respuesta de Jarvis</span>
                <textarea required minLength={10} maxLength={600} rows={4} value={f.respuesta} onChange={(e) => setF({ ...f, respuesta: e.target.value })} placeholder="Escríbela como la diría Jarvis: corta, clara y con tuteo." />
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} /> Jarvis puede usarla
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" disabled={a.enviando}>{f.id ? "Guardar cambios" : "Agregar tema"}</button>
                {f.id && <button type="button" className="btn claro" onClick={() => setF(VACIO)}>Cancelar</button>}
              </div>
            </form>
          </Seccion>

          <Seccion titulo="Lo que Jarvis ya sabe responder">
            {!temas ? <Cargando /> : !temas.length ? <div className="vacio">Todavía no hay temas cargados.</div> : (
              <table className="libro">
                <tbody>
                  {temas.map((t) => (
                    <tr key={t.id} style={{ opacity: t.activo ? 1 : 0.55 }}>
                      <td>
                        <b style={{ fontWeight: 500 }}>{t.tema}</b>{!t.activo && <span className="etiqueta tenue" style={{ marginLeft: 8 }}>apagado</span>}
                        <p style={{ margin: "4px 0", fontSize: 13 }}>{t.respuesta}</p>
                        <small>{t.palabras_clave.join(" · ")}</small>
                      </td>
                      <td style={{ whiteSpace: "nowrap", verticalAlign: "top" }}>
                        <button className="btn claro chico" onClick={() => editar(t)}>Editar</button>{" "}
                        <button className="btn claro chico" onClick={() => void borrar(t)} disabled={a.enviando}>Borrar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Seccion>
        </div>

        <Seccion titulo="Preguntas que Jarvis no pudo responder (30 días)">
          {!sinRespuesta ? <Cargando /> : !agrupado.length ? <div className="vacio">Jarvis tuvo datos para todo lo que le preguntaron.</div> : (
            <table className="libro">
              <thead><tr><th>Lo que buscaban</th><th className="der">Veces</th><th>Última vez</th><th /></tr></thead>
              <tbody>
                {agrupado.slice(0, 30).map((x) => (
                  <tr key={x.tema}>
                    <td>{x.tema}<small>«{x.ejemplo}»</small></td>
                    <td className="der">{x.veces}</td>
                    <td className="num">{fechaHora(x.ultima)}</td>
                    <td><button className="btn claro chico" onClick={() => setF({ ...VACIO, tema: x.tema.charAt(0).toUpperCase() + x.tema.slice(1), claves: x.tema })}>Responder</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="muted" style={{ fontSize: 13 }}>Si es algo que el Paseo no tiene (un gimnasio, una marca), es una señal para atraer nuevos locales; si es información que sí existe, cárgala a la izquierda y Jarvis la usará en la próxima pregunta.</p>
        </Seccion>
      </div>
    </>
  );
}

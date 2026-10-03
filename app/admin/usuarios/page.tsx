"use client";

import { useState } from "react";
import { Cabecera, Cargando, Mensajes, PanelLateral } from "@/components/marco";
import { api } from "@/lib/api";
import { fecha } from "@/lib/formato";
import { useAccion, useDatos } from "@/lib/use-datos";

const ROLES = [["", "Todos"], ["cliente", "Clientes"], ["cajero", "Cajeros"], ["gerente", "Gerentes"], ["admin", "Admin"], ["marketing", "Marketing"], ["analista", "Analistas"]];

/** HU-A02: bloquear clientes, crear personal de locales y roles internos (con doble factor). */
export default function Usuarios() {
  const [rol, setRol] = useState("gerente");
  const [q, setQ] = useState("");
  const { datos, recargar } = useDatos<any[]>(`/admin/usuarios?rol=${rol}${q ? `&q=${encodeURIComponent(q)}` : ""}`);
  const { datos: plano } = useDatos<any>("/recinto/plano");
  const [nuevo, setNuevo] = useState<any | null>(null);
  const a = useAccion();

  async function estado(id: string, accion: "bloquear" | "desbloquear") {
    const r = await a.ejecutar(() => api(`/admin/usuarios/${id}/${accion}`, { cuerpo: {} }), accion === "bloquear" ? "Usuario bloqueado" : "Usuario desbloqueado");
    if (r) void recargar();
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const r = await a.ejecutar(() => api("/admin/usuarios", { cuerpo: { ...nuevo, localId: nuevo.localId || undefined } }), "Usuario creado. Comparte la contraseña inicial por un canal seguro.");
    if (r) {
      setNuevo(null);
      void recargar();
    }
  }

  return (
    <>
      <Cabecera ceja="Programa" titulo="Usuarios y roles" descripcion="Los roles internos ingresan con doble factor. Bloquear a un usuario corta su acceso de inmediato.">
        <button className="btn" onClick={() => setNuevo({ nombre: "", correo: "", password: "", rol: "cajero", localId: "", etiqueta: "caja 1" })}>Nuevo usuario</button>
      </Cabecera>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div className="segmentado">{ROLES.map(([v, t]) => <button key={v} className={rol === v ? "on" : ""} onClick={() => setRol(v)}>{t}</button>)}</div>
        <input className="entrada" style={{ maxWidth: 280 }} placeholder="Buscar por nombre, correo o celular" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Mensajes error={!nuevo ? a.error : null} exito={a.exito} />
      {!datos ? <Cargando /> : (
        <table className="libro">
          <thead><tr><th>Nombre</th><th>Rol</th><th>Contacto</th><th>Local</th><th>Desde</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {datos.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td><span className="etiqueta tenue">{u.rol}</span></td>
                <td>{u.correo ?? u.celular}</td>
                <td>{u.local ?? "—"}<small>{u.etiqueta}</small></td>
                <td>{fecha(u.creado_en)}</td>
                <td><span className={`etiqueta ${u.estado === "activo" ? "exito" : "alerta"}`}>{u.estado}</span></td>
                <td className="der">
                  {u.estado === "activo" ? <button className="btn chico claro" onClick={() => estado(u.id, "bloquear")}>Bloquear</button> : <button className="btn chico" onClick={() => estado(u.id, "desbloquear")}>Desbloquear</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <PanelLateral abierto={!!nuevo} titulo="Nuevo usuario" onCerrar={() => setNuevo(null)}>
        {nuevo && (
          <form onSubmit={crear} style={{ display: "grid", gap: 14 }}>
            <label className="campo"><span>Nombre</span><input required value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></label>
            <label className="campo"><span>Correo</span><input required type="email" value={nuevo.correo} onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })} /></label>
            <label className="campo"><span>Contraseña inicial</span><input required minLength={8} type="text" value={nuevo.password} onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} /></label>
            <label className="campo">
              <span>Rol</span>
              <select value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}>
                <option value="cajero">Cajero de local</option><option value="gerente">Gerente de local</option>
                <option value="admin">Super admin</option><option value="marketing">Marketing</option><option value="analista">Analista</option>
              </select>
            </label>
            {["cajero", "gerente"].includes(nuevo.rol) && (
              <>
                <label className="campo">
                  <span>Local</span>
                  <select required value={nuevo.localId} onChange={(e) => setNuevo({ ...nuevo, localId: e.target.value })}>
                    <option value="">Elige…</option>
                    {plano?.locales.map((l: any) => <option key={l.id} value={l.id}>{l.nombre} · {l.numero_local}</option>)}
                  </select>
                </label>
                <label className="campo"><span>Etiqueta</span><input value={nuevo.etiqueta} onChange={(e) => setNuevo({ ...nuevo, etiqueta: e.target.value })} placeholder="caja 3" /></label>
              </>
            )}
            <Mensajes error={a.error} />
            <button className="btn" disabled={a.enviando}>Crear usuario</button>
          </form>
        )}
      </PanelLateral>
    </>
  );
}

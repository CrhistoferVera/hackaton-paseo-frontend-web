"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/api";
import { destinoDe, useSesion, type Usuario } from "@/lib/sesion";

function Formulario() {
  const { iniciar } = useSesion();
  const router = useRouter();
  const params = useSearchParams();
  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [desafio, setDesafio] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [codigoDev, setCodigoDev] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(params.get("expirada") ? "Tu sesión venció. Ingresa de nuevo." : null);
  const [enviando, setEnviando] = useState(false);

  const entrar = (token: string, u: Usuario) => {
    if (u.rol === "cliente") {
      setError("Esta es la consola de locales y administración. Los clientes usan la app Paseo Points en su celular.");
      return;
    }
    iniciar(token, u);
    router.replace(params.get("siguiente") ?? destinoDe(u.rol));
  };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      if (desafio) {
        const r = await api("/auth/2fa", { cuerpo: { desafio, codigo } });
        entrar(r.token, r.usuario);
      } else {
        const r = await api("/auth/login", { cuerpo: { identificador, password } });
        if (r.requiere2fa) {
          setDesafio(r.desafio);
          setCodigoDev(r.codigoDev ?? null);
        } else entrar(r.token, r.usuario);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} style={{ display: "grid", gap: 18 }}>
      {!desafio ? (
        <>
          <label className="campo">
            <span>Correo</span>
            <input autoFocus autoComplete="username" value={identificador} onChange={(e) => setIdentificador(e.target.value)} placeholder="comercio.cafealameda@paseo.bo" required />
          </label>
          <label className="campo">
            <span>Contraseña</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
        </>
      ) : (
        <label className="campo">
          <span>Código de verificación</span>
          <input autoFocus inputMode="numeric" maxLength={6} className="dato" style={{ fontSize: 22, letterSpacing: "0.3em" }} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} required />
          <small>
            Enviamos un código de 6 dígitos a tu correo. {codigoDev && <>En desarrollo el código es <b className="dato">{codigoDev}</b>.</>}
          </small>
        </label>
      )}
      {error && <div className="aviso error">{error}</div>}
      <button className="btn grande" disabled={enviando}>
        {enviando ? "Verificando…" : desafio ? "Verificar e ingresar" : "Ingresar"}
      </button>
      {desafio && (
        <button type="button" className="enlace" onClick={() => { setDesafio(null); setCodigo(""); }}>
          Volver
        </button>
      )}
    </form>
  );
}

export default function Login() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)" }} className="login">
      <section className="sala" style={{ padding: "56px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <span className="senal" style={{ color: "var(--sala-oro)" }}>Paseo Aranjuez</span>
          <h1 className="display" style={{ fontSize: "clamp(44px, 6vw, 84px)", lineHeight: 0.98, margin: "24px 0 0" }}>
            Paseo Points
            <em style={{ display: "block", fontSize: "0.4em", color: "var(--sala-grafito)", marginTop: 16 }}>Portal de locales y Centro de Inteligencia</em>
          </h1>
        </div>
        <p className="display" style={{ fontStyle: "italic", fontSize: 24, maxWidth: "26ch", lineHeight: 1.3 }}>
          Cada punto es un dato. <span style={{ color: "var(--sala-oro)" }}>Cada dato es una decisión.</span>
        </p>
      </section>
      <section style={{ padding: "56px clamp(20px, 6vw, 72px)", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 520 }}>
        <span className="ceja senal">Ingreso del personal</span>
        <h2 className="display" style={{ fontSize: 34, margin: "0 0 28px" }}>Inicia sesión</h2>
        <Suspense>
          <Formulario />
        </Suspense>
        <p className="muted" style={{ fontSize: 13, marginTop: 32 }}>
          Cada comercio entra a su panel con la cuenta de su negocio. Administración, marketing y analistas entran al Centro de Inteligencia con doble factor.
        </p>
      </section>
      <style>{`@media (max-width: 860px){ .login { grid-template-columns: 1fr !important; } .login > section:first-child { padding: 32px 20px !important; } }`}</style>
    </div>
  );
}

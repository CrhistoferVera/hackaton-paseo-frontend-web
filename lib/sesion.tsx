"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, guardarToken, leerToken } from "./api";

export type Rol = "cliente" | "comercio" | "admin" | "marketing" | "analista";
export interface Usuario {
  id: string;
  rol: Rol;
  nombre: string;
  correo: string | null;
  localId: string | null;
  caja?: string | null;
}

interface Contexto {
  usuario: Usuario | null;
  cargando: boolean;
  iniciar: (token: string, usuario: Usuario) => void;
  salir: () => void;
}

const Ctx = createContext<Contexto>({ usuario: null, cargando: true, iniciar: () => {}, salir: () => {} });
const CLAVE_USUARIO = "pp.usuario";

export function ProveedorSesion({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = leerToken();
    if (!token) {
      setCargando(false);
      return;
    }
    try {
      const guardado = localStorage.getItem(CLAVE_USUARIO);
      if (guardado) setUsuario(JSON.parse(guardado));
    } catch {
      /* sin almacenamiento */
    }
    api<any>("/auth/yo")
      .then((u) => {
        const v: Usuario = { id: u.id, rol: u.rol, nombre: u.nombre, correo: u.correo, localId: u.local_id, caja: u.caja };
        setUsuario(v);
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(v));
      })
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  const iniciar = useCallback((token: string, u: Usuario) => {
    guardarToken(token);
    try {
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify(u));
    } catch {
      /* sin almacenamiento */
    }
    setUsuario(u);
  }, []);

  const salir = useCallback(() => {
    guardarToken(null);
    try {
      localStorage.removeItem(CLAVE_USUARIO);
    } catch {
      /* sin almacenamiento */
    }
    setUsuario(null);
    location.assign(new URL("/login", location.origin).href);
  }, []);

  return <Ctx.Provider value={{ usuario, cargando, iniciar, salir }}>{children}</Ctx.Provider>;
}

export const useSesion = () => useContext(Ctx);

export const ES_COMERCIO = (r?: Rol) => r === "comercio";
export const ES_INTERNO = (r?: Rol) => r === "admin" || r === "marketing" || r === "analista";
export const destinoDe = (r: Rol) => (ES_COMERCIO(r) ? "/comercio/caja" : ES_INTERNO(r) ? "/admin/centro" : "/login?cliente=1");

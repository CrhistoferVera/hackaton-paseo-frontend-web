"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

/** Carga datos de una ruta del backend y expone `recargar` para refrescar tras una acción o un evento. */
export function useDatos<T = any>(ruta: string | null) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(!!ruta);

  const recargar = useCallback(async () => {
    if (!ruta) return;
    setCargando(true);
    try {
      setDatos(await api<T>(ruta));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [ruta]);

  useEffect(() => {
    void recargar();
    const alVolver = () => { if (document.visibilityState === 'visible') void recargar(); };
    window.addEventListener('focus', alVolver);
    document.addEventListener('visibilitychange', alVolver);
    return () => { window.removeEventListener('focus', alVolver); document.removeEventListener('visibilitychange', alVolver); };
  }, [recargar]);

  return { datos, error, cargando, recargar, setDatos };
}

/** Ejecuta una acción y gestiona su estado (enviando, error, mensaje de éxito). */
export function useAccion() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const ejecutar = useCallback(async <T,>(fn: () => Promise<T>, mensaje?: string | ((r: T) => string)) => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      const r = await fn();
      if (mensaje) setExito(typeof mensaje === "function" ? mensaje(r) : mensaje);
      return r;
    } catch (e: any) {
      setError(e.message);
      return undefined;
    } finally {
      setEnviando(false);
    }
  }, []);
  return { enviando, error, exito, ejecutar, setError, setExito };
}

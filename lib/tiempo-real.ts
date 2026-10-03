"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL, leerToken } from "./api";

let socket: Socket | null = null;
let tokenSocket: string | null = null;

/** Un solo socket compartido; se recrea solo si cambia la sesión. */
function conectar(): Socket | null {
  const token = leerToken();
  if (!token) return null;
  if (socket && tokenSocket === token) return socket;
  socket?.disconnect();
  tokenSocket = token;
  socket = io(API_URL, { auth: { token }, transports: ["websocket", "polling"], reconnectionDelay: 1500 });
  return socket;
}

/** Suscribe la pantalla a eventos en tiempo real del backend (Observer). */
export function useTiempoReal(eventos: Record<string, (datos: any) => void>) {
  const ref = useRef(eventos);
  useEffect(() => {
    ref.current = eventos;
  });
  useEffect(() => {
    const s = conectar();
    if (!s) return;
    const nombres = Object.keys(ref.current);
    const manejadores = nombres.map((n) => {
      const fn = (d: any) => ref.current[n]?.(d);
      s.on(n, fn);
      return [n, fn] as const;
    });
    return () => {
      manejadores.forEach(([n, fn]) => s.off(n, fn));
    };
  }, []);
}

export function estadoSocket() {
  return socket?.connected ?? false;
}

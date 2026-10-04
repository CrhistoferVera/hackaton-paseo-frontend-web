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
  ref.current = eventos;

  useEffect(() => {
    let s = conectar();
    const manejadores: [string, (datos: any) => void][] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;

    function registrar(sock: Socket) {
      for (const n of Object.keys(ref.current)) {
        const fn = (d: any) => ref.current[n]?.(d);
        sock.on(n, fn);
        manejadores.push([n, fn]);
      }
      if (sock.connected && ref.current.connect) {
        try {
          ref.current.connect(null);
        } catch {}
      }
    }

    if (s) {
      registrar(s);
    } else {
      timer = setTimeout(() => {
        s = conectar();
        if (s) registrar(s);
      }, 500);
    }

    return () => {
      if (timer) clearTimeout(timer);
      manejadores.forEach(([n, fn]) => s?.off(n, fn));
    };
  }, []);
}

export function estadoSocket() {
  return socket?.connected ?? false;
}


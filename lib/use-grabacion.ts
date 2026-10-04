"use client";

import { useEffect, useRef, useState } from "react";

/** Audio del navegador; el servidor transcribe la grabación completa. */
export function useGrabacion(alAudio: (audio: Blob) => void, alError: (mensaje: string) => void) {
  const [estado, setEstado] = useState<"inactivo" | "permiso" | "grabando">("inactivo");
  const [segundos, setSegundos] = useState(0);
  const sesion = useRef(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const flujo = useRef<MediaStream | null>(null);
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null);
  const limite = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbacks = useRef({ alAudio, alError });
  useEffect(() => { callbacks.current = { alAudio, alError }; }, [alAudio, alError]);

  function liberar() {
    flujo.current?.getTracks().forEach(pista => pista.stop());
    flujo.current = null;
    if (reloj.current) clearInterval(reloj.current);
    if (limite.current) clearTimeout(limite.current);
    reloj.current = null;
    limite.current = null;
  }

  function detener() {
    if (recorder.current?.state === "recording") recorder.current.stop();
    liberar();
    setEstado("inactivo");
  }

  function cancelar() {
    sesion.current++;
    if (recorder.current) {
      recorder.current.onstop = null;
      recorder.current.ondataavailable = null;
      recorder.current.onerror = null;
      if (recorder.current.state !== "inactive") recorder.current.stop();
      recorder.current = null;
    }
    liberar();
    setEstado("inactivo");
    setSegundos(0);
  }

  useEffect(() => () => {
    sesion.current++;
    if (recorder.current) {
      recorder.current.onstop = null;
      recorder.current.ondataavailable = null;
      recorder.current.onerror = null;
      if (recorder.current.state !== "inactive") recorder.current.stop();
    }
    liberar();
  }, []);

  async function empezar() {
    if (flujo.current || recorder.current?.state === "recording") return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      callbacks.current.alError("Este navegador no permite grabar audio. Usa un navegador compatible con HTTPS o escribe tu pregunta.");
      return;
    }
    const id = ++sesion.current;
    setEstado("permiso");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (id !== sesion.current) { stream.getTracks().forEach(p => p.stop()); return; }
      flujo.current = stream;
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(t => MediaRecorder.isTypeSupported(t));
      const r = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const partes: Blob[] = [];
      recorder.current = r;
      r.ondataavailable = e => { if (e.data.size) partes.push(e.data); };
      r.onstop = () => {
        recorder.current = null;
        if (id !== sesion.current) return;
        const audio = new Blob(partes, { type: r.mimeType });
        if (!audio.size) callbacks.current.alError("No se grabó audio. Inténtalo de nuevo.");
        else if (audio.size > 6 * 1024 * 1024) callbacks.current.alError("El audio supera 6 MB. Graba una pregunta más corta.");
        else callbacks.current.alAudio(audio);
      };
      r.onerror = () => { cancelar(); callbacks.current.alError("La grabación se interrumpió. Inténtalo de nuevo."); };
      r.start();
      setSegundos(0);
      setEstado("grabando");
      reloj.current = setInterval(() => setSegundos(s => s + 1), 1000);
      limite.current = setTimeout(detener, 120000);
    } catch (error) {
      if (id !== sesion.current) return;
      cancelar();
      callbacks.current.alError(error instanceof DOMException && error.name === "NotAllowedError"
        ? "Permite el acceso al micrófono en tu navegador para preguntar por voz. También puedes escribir."
        : "No se pudo acceder al micrófono. Comprueba que esté conectado y disponible.");
    }
  }

  return { estado, segundos, empezar, detener, cancelar };
}

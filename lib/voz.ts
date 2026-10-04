"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL, api } from "./api";

/**
 * Voz del asistente para administración, en el navegador:
 *  - Escuchar: graba con MediaRecorder y manda el audio al servidor del Paseo, que lo transcribe con
 *    Whisper local (no usa el reconocedor de Google del navegador, que falla con «Network»).
 *  - Hablar: la respuesta se sintetiza en el servidor con la voz neuronal en español (Piper es_MX) y se
 *    reproduce como MP3, por oraciones para que empiece a sonar enseguida. Si el servidor no tiene la
 *    voz, usa una voz en español del navegador.
 */

const CLAVE_VOZ = "pp.admin.voz";
const MAX_SEGUNDOS = 20;

// ------------------------------------------------------------------ hablar

let turno = 0;
let actual: HTMLAudioElement | null = null;

/** Corta en oraciones (y frases largas por comas) para empezar a hablar enseguida. */
function trozos(texto: string) {
  const oraciones = texto.replace(/\s+/g, " ").match(/[^.!?;]+[.!?;]*/g) ?? [texto];
  const out: string[] = [];
  for (const o of oraciones.map((x) => x.trim()).filter(Boolean)) {
    if (o.length <= 220) out.push(o);
    else out.push(...(o.match(/.{1,200}(,|$)/g) ?? [o]).map((x) => x.trim()).filter(Boolean));
  }
  return out;
}

async function sintetizar(texto: string): Promise<string | null> {
  try {
    const r = await api<{ url: string }>("/admin/asistente/hablar", { cuerpo: { texto } });
    return `${API_URL}${r.url}`;
  } catch {
    return null;
  }
}

function reproducir(url: string, mio: number) {
  return new Promise<void>((ok) => {
    if (mio !== turno) return ok();
    const a = new Audio(url);
    actual = a;
    a.onended = () => ok();
    a.onerror = () => ok();
    a.play().catch(() => ok());
  });
}

function vozDelNavegador(texto: string, mio: number) {
  return new Promise<void>((ok) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || mio !== turno) return ok();
    const u = new SpeechSynthesisUtterance(texto);
    const voces = window.speechSynthesis.getVoices();
    u.voice = ["es-MX", "es-US", "es-419", "es-BO", "es-ES"].map((l) => voces.find((v) => v.lang === l)).find(Boolean) ?? voces.find((v) => v.lang.startsWith("es")) ?? null;
    u.lang = u.voice?.lang ?? "es-MX";
    u.onend = () => ok();
    u.onerror = () => ok();
    window.speechSynthesis.speak(u);
  });
}

/** Dice el texto con la voz neuronal del Paseo; mientras suena una oración ya se prepara la siguiente. */
export async function hablar(texto: string) {
  callar();
  const mio = ++turno;
  const partes = trozos(texto);
  let siguiente = partes.length ? sintetizar(partes[0]) : null;
  for (let i = 0; i < partes.length && mio === turno; i++) {
    const url = await siguiente;
    siguiente = i + 1 < partes.length ? sintetizar(partes[i + 1]) : null;
    if (mio !== turno) return;
    if (url) await reproducir(url, mio);
    else await vozDelNavegador(partes[i], mio);
  }
}

export function callar() {
  turno++;
  actual?.pause();
  actual = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** Preferencia «leer las respuestas en voz alta» (se recuerda en este navegador). */
export function useVozActiva(): [boolean, (v: boolean) => void] {
  const [activa, setActiva] = useState(false);
  useEffect(() => {
    try {
      setActiva(localStorage.getItem(CLAVE_VOZ) === "1");
    } catch {
      /* sin almacenamiento */
    }
  }, []);
  const cambiar = useCallback((v: boolean) => {
    setActiva(v);
    if (!v) callar();
    try {
      localStorage.setItem(CLAVE_VOZ, v ? "1" : "0");
    } catch {
      /* sin almacenamiento */
    }
  }, []);
  return [activa, cambiar];
}

// ------------------------------------------------------------------ escuchar

export type EstadoEscucha = "inactivo" | "permiso" | "grabando" | "procesando";

/** Formato que el navegador sabe grabar (Chrome y Edge: webm/opus; Safari: mp4/aac). */
function formato() {
  if (typeof MediaRecorder === "undefined") return null;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

/**
 * Graba la pregunta y la manda a `ruta` (campo «audio»). El servidor transcribe y responde en la misma
 * llamada. Toca una vez para hablar y otra para enviar; corta solo a los 20 segundos.
 */
export function useEscucha<T extends { texto: string }>(ruta: string, alResponder: (r: T) => void) {
  const [estado, setEstado] = useState<EstadoEscucha>("inactivo");
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const grabador = useRef<MediaRecorder | null>(null);
  const partes = useRef<Blob[]>([]);
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null);
  const callback = useRef(alResponder);
  useEffect(() => {
    callback.current = alResponder;
  });
  useEffect(
    () => () => {
      if (reloj.current) clearInterval(reloj.current);
      grabador.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const detener = useCallback(() => {
    if (reloj.current) clearInterval(reloj.current);
    reloj.current = null;
    if (grabador.current?.state === "recording") grabador.current.stop();
  }, []);

  const iniciar = useCallback(async () => {
    setError(null);
    callar();
    if (typeof window !== "undefined" && !window.isSecureContext) {
      return setError("El navegador solo permite el micrófono en https o en localhost. Abre el panel con http://localhost:3000.");
    }
    const tipo = formato();
    if (tipo === null || !navigator.mediaDevices?.getUserMedia) return setError("Este navegador no puede grabar audio. Usa Chrome, Edge o Safari actualizados.");
    let stream: MediaStream;
    setEstado("permiso");
    try {
      // Si el navegador nunca responde al pedido de permiso, no se queda colgado
      stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }),
        new Promise<never>((_, falla) => setTimeout(() => falla(Object.assign(new Error("sin respuesta"), { name: "Timeout" })), 20_000)),
      ]);
    } catch (e: any) {
      setEstado("inactivo");
      return setError(
        e?.name === "NotAllowedError" ? "Permite el micrófono para este sitio (ícono del candado en la barra de direcciones)."
          : e?.name === "Timeout" ? "El navegador no respondió al pedido del micrófono. Revisa el permiso del sitio o usa Chrome o Edge."
            : "No encontré un micrófono disponible.",
      );
    }
    const rec = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
    partes.current = [];
    rec.ondataavailable = (e) => e.data.size && partes.current.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(partes.current, { type: rec.mimeType || "audio/webm" });
      if (blob.size < 1200) {
        setEstado("inactivo");
        return setError("No se grabó audio. Mantén el micrófono abierto mientras hablas.");
      }
      setEstado("procesando");
      try {
        const fd = new FormData();
        fd.append("audio", blob, `voz.${blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm"}`);
        const r = await api<T>(ruta, { formulario: fd });
        if (!r.texto) setError("No te escuché bien. Habla un poco más fuerte o más cerca del micrófono.");
        else callback.current(r);
      } catch (e: any) {
        setError(e.message ?? "No se pudo enviar el audio");
      } finally {
        setEstado("inactivo");
      }
    };
    grabador.current = rec;
    rec.start();
    setEstado("grabando");
    setSegundos(0);
    const inicio = Date.now();
    reloj.current = setInterval(() => {
      const s = Math.floor((Date.now() - inicio) / 1000);
      setSegundos(s);
      if (s >= MAX_SEGUNDOS) detener();
    }, 250);
  }, [ruta, detener]);

  return { estado, escuchando: estado === "grabando", segundos, error, iniciar, detener };
}

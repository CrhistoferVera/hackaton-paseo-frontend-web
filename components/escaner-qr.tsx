"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Lector de QR con la cámara del celular o la tableta del mostrador (html5-qrcode).
 * Siempre ofrece ingresar el código a mano como alternativa.
 */
export function EscanerQR({ onLeido, etiqueta = "Escanear con la cámara", pausado = false }: { onLeido: (texto: string) => void; etiqueta?: string; pausado?: boolean }) {
  const id = useId().replace(/:/g, "");
  const [activo, setActivo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const lector = useRef<any>(null);
  const ultimo = useRef<{ t: string; en: number } | null>(null);
  const callback = useRef(onLeido);
  useEffect(() => {
    callback.current = onLeido;
  });

  useEffect(() => {
    if (!activo || pausado) return;
    let cancelado = false;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelado) return;
        const l = new Html5Qrcode(`qr-${id}`);
        lector.current = l;
        await l.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (texto: string) => {
            const ahora = Date.now();
            if (ultimo.current && ultimo.current.t === texto && ahora - ultimo.current.en < 3000) return;
            ultimo.current = { t: texto, en: ahora };
            callback.current(texto);
          },
          () => undefined,
        );
      } catch (e: any) {
        setError(e?.message?.includes("Permission") ? "Permite el acceso a la cámara para escanear." : "No se pudo abrir la cámara. Ingresa el código a mano.");
        setActivo(false);
      }
    })();
    return () => {
      cancelado = true;
      const l = lector.current;
      lector.current = null;
      if (l) l.stop().then(() => l.clear()).catch(() => undefined);
    };
  }, [activo, pausado, id]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div
        id={`qr-${id}`}
        style={{ width: "100%", maxWidth: 360, aspectRatio: activo ? "1" : undefined, background: activo ? "#000" : undefined, display: activo ? "block" : "none" }}
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn claro" onClick={() => { setError(null); setActivo((a) => !a); }}>
          {activo ? "Detener cámara" : etiqueta}
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (manual.trim()) onLeido(manual.trim());
          setManual("");
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input className="entrada" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="o pega / escribe el código" aria-label="Código" />
        <button className="btn claro" type="submit">Usar</button>
      </form>
      {error && <div className="aviso error">{error}</div>}
    </div>
  );
}

"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";

/** Mueve la vista sin alterar las coordenadas del plano o los locales. */
export function MapaInteractivo({ children, nombre = "Mapa del Paseo" }: { children: ReactNode; nombre?: string }) {
  const [vista, setVista] = useState({ x: 0, y: 0, escala: 1 });
  const arrastre = useRef<{ id: number; x: number; y: number; origenX: number; origenY: number; movido: boolean } | null>(null);
  const omitirClic = useRef(false);
  const punteros = useRef(new Map<number, { x: number; y: number }>());
  const pellizco = useRef<{ distancia: number; escala: number } | null>(null);
  const escala = (v: number) => Math.max(0.6, Math.min(3, v));

  function empezar(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    omitirClic.current = false;
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // Capturamos solo tras arrastrar: un clic conserva la selección de un local.
    arrastre.current = { id: e.pointerId, x: e.clientX, y: e.clientY, origenX: vista.x, origenY: vista.y, movido: false };
    if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()];
      pellizco.current = { distancia: Math.hypot(a.x - b.x, a.y - b.y), escala: vista.escala };
    }
  }
  function mover(e: PointerEvent<HTMLDivElement>) {
    if (!punteros.current.has(e.pointerId)) return;
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punteros.current.size === 2 && pellizco.current) {
      const [a, b] = [...punteros.current.values()];
      const p = pellizco.current;
      if (p.distancia > 0) setVista(v => ({ ...v, escala: escala(p.escala * Math.hypot(a.x - b.x, a.y - b.y) / p.distancia) }));
      omitirClic.current = true;
      return;
    }
    const a = arrastre.current;
    if (!a || a.id !== e.pointerId || pellizco.current) return;
    const dx = e.clientX - a.x, dy = e.clientY - a.y;
    if (!a.movido && Math.hypot(dx, dy) < 5) return;
    a.movido = true;
    omitirClic.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setVista(v => ({ ...v, x: a.origenX + dx, y: a.origenY + dy }));
  }
  function terminar(e: PointerEvent<HTMLDivElement>) {
    punteros.current.delete(e.pointerId);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (punteros.current.size === 0) { arrastre.current = null; pellizco.current = null; }
  }

  return (
    <section className="mapa-interactivo" aria-label={nombre}>
      <div className="mapa-controles">
        <span>Arrastra para mover. Usa los controles para acercar.</span>
        <div>
          <button type="button" className="btn claro chico" aria-label="Alejar mapa" disabled={vista.escala <= 0.6} onClick={() => setVista(v => ({ ...v, escala: escala(v.escala - 0.2) }))}>−</button>
          <output className="mapa-escala" aria-label="Zoom del mapa">{Math.round(vista.escala * 100)}%</output>
          <button type="button" className="btn claro chico" aria-label="Acercar mapa" disabled={vista.escala >= 3} onClick={() => setVista(v => ({ ...v, escala: escala(v.escala + 0.2) }))}>+</button>
          <button type="button" className="btn claro chico" onClick={() => setVista({ x: 0, y: 0, escala: 1 })}>Centrar</button>
        </div>
      </div>
      <div className="mapa-lienzo" tabIndex={0} aria-label="Vista del mapa; las flechas mueven el plano" onPointerDown={empezar} onPointerMove={mover} onPointerUp={terminar} onPointerCancel={terminar} onClickCapture={e => {
        if (omitirClic.current) { e.stopPropagation(); e.preventDefault(); omitirClic.current = false; }
      }} onKeyDown={e => {
        if (e.target !== e.currentTarget) return;
        const pasos: Record<string, [number, number]> = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] };
        if (pasos[e.key]) { e.preventDefault(); const [x, y] = pasos[e.key]; setVista(v => ({ ...v, x: v.x + x, y: v.y + y })); }
        if (e.key === "Home") { e.preventDefault(); setVista({ x: 0, y: 0, escala: 1 }); }
      }}>
        <div className="mapa-transformacion" style={{ transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.escala})` }}>{children}</div>
      </div>
    </section>
  );
}

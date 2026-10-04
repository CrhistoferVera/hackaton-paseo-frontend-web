"use client";

import Link from "next/link";
import { useState } from "react";
import { Cargando, Mensajes } from "@/components/marco";
import { nivelesPlano, type Plano } from "@/components/plano";
import { useDatos } from "@/lib/use-datos";

/** Presentación del edificio: la silueta organiza el directorio real, sin simular métricas. */
export default function MapaPaseo() {
  const { datos: plano, error } = useDatos<Plano>("/recinto/plano");
  const [seleccion, setSeleccion] = useState("");
  const niveles = plano ? nivelesPlano(plano) : [];
  const nivel = niveles.find(n => n.id === seleccion) ?? niveles[0];
  const locales = plano?.locales.filter(l => l.piso === nivel?.id) ?? [];
  const altura = 120 + niveles.length * 88;
  return (
    <div className="edificio-presentacion">
      <h1>El Paseo,<br />nivel por nivel.</h1>
      <p>Un edificio que se puede entender de un vistazo. Cada espacio de esta silueta representa un comercio registrado en el sistema.</p>
      <Mensajes error={error} />
      {!plano ? <Cargando texto="Cargando el directorio del Paseo…" /> : !niveles.length ? <div className="vacio">Registra locales y zonas para ver los niveles del Paseo.</div> : (
        <>
          <div className="mapa-resumen">
            <span><strong>{plano.locales.length}</strong> comercios registrados</span>
            <span><strong>{niveles.length}</strong> niveles</span>
            <span><strong>{plano.zonas.length}</strong> zonas</span>
          </div>
          <svg className="edificio-silueta" viewBox={`0 0 1080 ${altura}`} role="img" aria-label={`Silueta esquemática del Paseo con ${plano.locales.length} locales en ${niveles.length} niveles`}>
            <path d="M100 70 L148 36 H916 L980 70" fill="#242424" stroke="#525252" />
            <path d={`M100 70 V${altura - 40} H980 V70`} fill="#1a1a1a" stroke="#525252" />
            {[...niveles].reverse().map((n, i) => {
              const y = 76 + i * 88;
              const negocios = plano.locales.filter(l => l.piso === n.id).sort((a, b) => Number(a.coord_x) - Number(b.coord_x) || a.numero_local.localeCompare(b.numero_local, "es", { numeric: true }));
              const paso = 840 / Math.max(1, negocios.length);
              const activo = nivel?.id === n.id;
              return (
                <g key={n.id}>
                  <rect x="104" y={y} width="872" height="80" fill={activo ? "#29241a" : "#1a1a1a"} />
                  <line x1="100" y1={y + 82} x2="980" y2={y + 82} stroke={activo ? "#f4b41a" : "#525252"} />
                  <text x="82" y={y + 46} textAnchor="end" fill={activo ? "#f4b41a" : "#a3a3a3"} fontSize="15" fontFamily="var(--f-texto)">{n.id === "T" ? "PB" : n.id}</text>
                  {negocios.map((l, j) => (
                    <g key={l.id}>
                      <title>{l.nombre} · {n.nombre} · Local {l.numero_local}</title>
                      <rect x={120 + j * paso} y={y + 14} width={Math.max(2, paso - 7)} height="50" rx="2" fill={activo ? "#493b20" : "#282828"} stroke={activo ? "#ad831e" : "#444444"} opacity={l.activo ? 1 : 0.4} />
                      <line x1={120 + j * paso + (paso - 7) / 2} y1={y + 18} x2={120 + j * paso + (paso - 7) / 2} y2={y + 60} stroke={activo ? "#ad831e" : "#444444"} />
                    </g>
                  ))}
                  <text x="1000" y={y + 44} fill={activo ? "#fff" : "#a3a3a3"} fontSize="13" fontFamily="var(--f-texto)">{negocios.length} locales</text>
                </g>
              );
            })}
            <line x1="60" y1={altura - 36} x2="1020" y2={altura - 36} stroke="#f4b41a" />
          </svg>
          <nav className="edificio-directorio" aria-label="Niveles del edificio">
            {niveles.map(n => <button key={n.id} aria-pressed={nivel?.id === n.id} onClick={() => setSeleccion(n.id)}><strong>{n.nombre}</strong><span>{plano.locales.filter(l => l.piso === n.id).length} comercios</span></button>)}
          </nav>
          <div className="edificio-detalle">
            <div>
              <h2>{nivel?.nombre}</h2>
              <ul className="edificio-nombres">{locales.map(l => <li key={l.id}>{l.nombre}</li>)}</ul>
            </div>
            <Link className="btn claro" href="/admin/locales">Explorar el plano</Link>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 28 }}>Representación visual del directorio. La silueta no reproduce la geometría arquitectónica ni muestra aforo o recorridos estimados.</p>
        </>
      )}
    </div>
  );
}

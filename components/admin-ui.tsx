"use client";
import { useState, type ReactNode } from "react";

/** Pagina únicamente los registros recibidos; no altera datos del servidor. */
export function ListaPaginada<T>({
  datos,
  children,
  tamano = 8,
  nombre = "registros",
}: {
  datos: T[];
  children: (pagina: T[]) => ReactNode;
  tamano?: number;
  nombre?: string;
}) {
  const [pagina, setPagina] = useState(1);
  const paginas = Math.max(1, Math.ceil(datos.length / tamano));
  const actual = Math.min(pagina, paginas);
  const inicio = (actual - 1) * tamano;
  if (!datos.length) return <div className="vacio">No hay {nombre} en esta vista.</div>;
  return (
    <div>
      <div className="tabla-envoltura">{children(datos.slice(inicio, inicio + tamano))}</div>
      <nav className="paginacion" aria-label={"Paginación de " + nombre}>
        <span aria-live="polite">
          {inicio + 1}–{Math.min(inicio + tamano, datos.length)} de {datos.length} {nombre}
        </span>
        <div>
          <button type="button" className="btn chico claro" disabled={actual === 1} onClick={() => setPagina(actual - 1)}>
            Anterior
          </button>
          <span>
            Página {actual} de {paginas}
          </span>
          <button type="button" className="btn chico claro" disabled={actual === paginas} onClick={() => setPagina(actual + 1)}>
            Siguiente
          </button>
        </div>
      </nav>
    </div>
  );
}
export function Guia({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <aside className="guia-admin">
      <strong>{titulo}</strong>
      <p>{children}</p>
    </aside>
  );
}
export function Desplegable({ titulo, children, abierto = false }: { titulo: string; children: ReactNode; abierto?: boolean }) {
  return (
    <details className="desplegable-admin" open={abierto}>
      <summary>{titulo}</summary>
      <div>{children}</div>
    </details>
  );
}

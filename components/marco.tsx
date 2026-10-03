"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { type Rol, useSesion } from "@/lib/sesion";

export interface ItemNav {
  href: string;
  texto: string;
  roles?: Rol[];
  grupo?: string;
  marca?: React.ReactNode;
}

/** Estructura de las pantallas con sesión: barra lateral con navegación por rol y guardia de acceso. */
export function Marco({ roles, items, titulo, subtitulo, children }: { roles: Rol[]; items: ItemNav[]; titulo: string; subtitulo: string; children: React.ReactNode }) {
  const { usuario, cargando, salir } = useSesion();
  const ruta = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && (!usuario || !roles.includes(usuario.rol))) router.replace(`/login?siguiente=${encodeURIComponent(ruta)}`);
  }, [cargando, usuario, roles, ruta, router]);

  if (cargando || !usuario || !roles.includes(usuario.rol)) {
    return <div className="contenido muted">Verificando tu sesión…</div>;
  }

  const visibles = items.filter((i) => !i.roles || i.roles.includes(usuario.rol));
  return (
    <div className="marco">
      <aside className="lateral">
        <div className="marca">
          <span className="senal oro">Paseo Points</span>
          <b>{titulo}</b>
          <span className="muted" style={{ fontSize: 13 }}>{subtitulo}</span>
        </div>
        <nav aria-label="Secciones">
          {visibles.map((i, k) => {
            const encabezado = i.grupo && i.grupo !== visibles[k - 1]?.grupo ? <div className="grupo senal">{i.grupo}</div> : null;
            const activo = ruta === i.href || (i.href !== "/admin/centro" && ruta.startsWith(i.href + "/"));
            return (
              <div key={i.href} style={{ display: "contents" }}>
                {encabezado}
                <Link href={i.href} className={activo ? "activo" : ""}>
                  <span>{i.texto}</span>
                  {i.marca}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="pie">
          <div style={{ fontWeight: 500 }}>{usuario.nombre}</div>
          <div className="muted senal" style={{ margin: "4px 0 10px" }}>
            {usuario.rol}
            {usuario.caja ? ` · ${usuario.caja}` : ""}
          </div>
          <button className="enlace" onClick={salir}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="contenido">{children}</main>
    </div>
  );
}

export function Cabecera({ ceja, titulo, descripcion, children }: { ceja?: string; titulo: string; descripcion?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="cabecera">
      <div>
        {ceja && <span className="ceja senal">{ceja}</span>}
        <h1 className="titulo">{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {children && <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>{children}</div>}
    </header>
  );
}

export function Seccion({ titulo, accion, children }: { titulo: string; accion?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="seccion">
      <header>
        <h2>{titulo}</h2>
        {accion}
      </header>
      {children}
    </section>
  );
}

export function Indicador({ etiqueta, valor, detalle, oro }: { etiqueta: string; valor: React.ReactNode; detalle?: React.ReactNode; oro?: boolean }) {
  return (
    <div className="indicador">
      <span className="senal muted">{etiqueta}</span>
      <span className={`cifra ${oro ? "oro" : ""}`}>{valor}</span>
      {detalle && <small>{detalle}</small>}
    </div>
  );
}

export function Mensajes({ error, exito }: { error?: string | null; exito?: string | null }) {
  if (!error && !exito) return null;
  return (
    <div role="status" style={{ margin: "12px 0" }}>
      {error && <div className="aviso error">{error}</div>}
      {exito && <div className="aviso exito">{exito}</div>}
    </div>
  );
}

export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return <div className="vacio">{texto}</div>;
}

export function PanelLateral({ abierto, titulo, onCerrar, children }: { abierto: boolean; titulo: string; onCerrar: () => void; children: React.ReactNode }) {
  if (!abierto) return null;
  return (
    <>
      <div className="velo" onClick={onCerrar} />
      <aside className="panel-lateral" role="dialog" aria-label={titulo}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <h2 className="display" style={{ fontSize: 26, margin: 0 }}>{titulo}</h2>
          <button className="enlace" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}

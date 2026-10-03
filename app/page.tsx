"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { destinoDe, useSesion } from "@/lib/sesion";

export default function Inicio() {
  const { usuario, cargando } = useSesion();
  const router = useRouter();
  useEffect(() => {
    if (cargando) return;
    router.replace(usuario ? destinoDe(usuario.rol) : "/login");
  }, [usuario, cargando, router]);
  return <div className="contenido muted">Abriendo Paseo Points…</div>;
}

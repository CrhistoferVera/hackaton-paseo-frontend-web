"use client";

import { Marco, type ItemNav } from "@/components/marco";

const ITEMS: ItemNav[] = [
  { href: "/admin/centro", texto: "Gemelo digital", grupo: "Centro de Inteligencia" },
  { href: "/admin/horarios", texto: "Días y horarios", grupo: "Centro de Inteligencia" },
  { href: "/admin/segmentos", texto: "Clientes y segmentos", grupo: "Centro de Inteligencia" },
  { href: "/admin/afinidad", texto: "Cruce de compras", grupo: "Centro de Inteligencia" },
  { href: "/admin/embudo", texto: "Imanes y dependientes", grupo: "Centro de Inteligencia" },
  { href: "/admin/demanda", texto: "Demanda insatisfecha", grupo: "Centro de Inteligencia" },
  { href: "/admin/roi", texto: "Retorno de incentivos", grupo: "Centro de Inteligencia" },
  { href: "/admin/cohortes", texto: "Retención", grupo: "Centro de Inteligencia" },
  { href: "/admin/economia", texto: "Economía del programa", grupo: "Centro de Inteligencia" },
  { href: "/admin/paseoya", texto: "PaseoYa", grupo: "Centro de Inteligencia" },
  { href: "/admin/jarvis", texto: "Jarvis y grafo", grupo: "Centro de Inteligencia" },
  { href: "/admin/fraude", texto: "Alertas de fraude", grupo: "Confianza", roles: ["admin", "analista"] },
  { href: "/admin/auditoria", texto: "Auditoría", grupo: "Confianza", roles: ["admin"] },
  { href: "/admin/locales", texto: "Locales y plano", grupo: "Programa", roles: ["admin", "marketing"] },
  { href: "/admin/usuarios", texto: "Usuarios y roles", grupo: "Programa", roles: ["admin"] },
  { href: "/admin/reglas", texto: "Reglas de puntos", grupo: "Programa" },
  { href: "/admin/recompensas", texto: "Recompensas", grupo: "Programa", roles: ["admin", "marketing"] },
  { href: "/admin/misiones", texto: "Misiones", grupo: "Programa", roles: ["admin", "marketing"] },
  { href: "/admin/promociones", texto: "Promociones", grupo: "Programa", roles: ["admin", "marketing"] },
  { href: "/admin/categorias", texto: "Categorías y destacados", grupo: "Programa", roles: ["admin", "marketing"] },
  { href: "/admin/drops", texto: "Drops y hitos AR", grupo: "Programa", roles: ["admin", "marketing"] },
  { href: "/admin/eventos", texto: "Eventos del Paseo", grupo: "Programa", roles: ["admin", "marketing"] },
];

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <Marco roles={["admin", "marketing", "analista"]} items={ITEMS} titulo="Centro de Inteligencia" subtitulo="Paseo Aranjuez">
      {children}
    </Marco>
  );
}

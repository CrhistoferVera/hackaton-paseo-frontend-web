"use client";

import { Marco, type ItemNav } from "@/components/marco";

const ITEMS: ItemNav[] = [
  {
    href: "/admin/asistente",
    texto: "Asistente IA",
    grupo: "Tu copiloto",
    destacado: true,
    marca: <span className="etiqueta">IA</span>,
  },
  { href: "/admin/centro", texto: "Gemelo digital", grupo: "Entender el Paseo" },
  { href: "/admin/ofertas", texto: "Ofertas IA y equidad", grupo: "Entender el Paseo" },
  { href: "/admin/horarios", texto: "Días y horarios", grupo: "Entender el Paseo" },
  { href: "/admin/afinidad", texto: "Cruce de compras", grupo: "Entender el Paseo" },
  { href: "/admin/demanda", texto: "Demanda insatisfecha", grupo: "Entender el Paseo" },
  { href: "/admin/jarvis", texto: "Mapa del Paseo", grupo: "Entender el Paseo" },
  { href: "/admin/paseoya", texto: "PaseoYa", grupo: "Operación" },
  { href: "/admin/fraude", texto: "Alertas de fraude", grupo: "Operación", roles: ["admin", "analista"] },
  { href: "/admin/locales", texto: "Locales y planos", grupo: "Operación", roles: ["admin", "marketing"] },
  { href: "/admin/promociones", texto: "Promociones", grupo: "Activar visitas", roles: ["admin", "marketing"] },
  { href: "/admin/recompensas", texto: "Recompensas", grupo: "Activar visitas", roles: ["admin", "marketing"] },
  { href: "/admin/misiones", texto: "Misiones", grupo: "Activar visitas", roles: ["admin", "marketing"] },
  { href: "/admin/categorias", texto: "Categorías y destacados", grupo: "Activar visitas", roles: ["admin", "marketing"] },
  { href: "/admin/eventos", texto: "Eventos del Paseo", grupo: "Activar visitas", roles: ["admin", "marketing"] },
  { href: "/admin/usuarios", texto: "Usuarios y roles", grupo: "Configuración", roles: ["admin"] },
  { href: "/admin/reglas", texto: "Reglas de puntos", grupo: "Configuración" },
];

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <Marco variante="admin" roles={["admin", "marketing", "analista"]} items={ITEMS} titulo="Centro de Inteligencia" subtitulo="Paseo Aranjuez">
      <div className="admin-ui">{children}</div>
    </Marco>
  );
}

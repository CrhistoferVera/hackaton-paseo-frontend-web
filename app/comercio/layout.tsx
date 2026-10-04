"use client";

import { Marco, type ItemNav } from "@/components/marco";
import { useSesion } from "@/lib/sesion";

const ITEMS: ItemNav[] = [
  { href: "/comercio/panel", texto: "Panel de clientes", grupo: "Resumen" },
  { href: "/comercio/caja", texto: "Caja", grupo: "Mostrador" },
  { href: "/comercio/cupones", texto: "Canjear puntos", grupo: "Mostrador" },
  { href: "/comercio/pedidos", texto: "Pedidos PaseoYa", grupo: "Mostrador" },
  { href: "/comercio/productos", texto: "Productos PaseoYa", grupo: "Mi negocio" },
  { href: "/comercio/promociones", texto: "Promociones", grupo: "Mi negocio" },
  { href: "/comercio/drops", texto: "Drops", grupo: "Mi negocio" },
  { href: "/comercio/eventos", texto: "Eventos", grupo: "Mi negocio" },
  { href: "/comercio/movimientos", texto: "Movimientos", grupo: "Resultados" },
  { href: "/comercio/qr", texto: "QR de la puerta", grupo: "Resultados" },
];

export default function LayoutComercio({ children }: { children: React.ReactNode }) {
  const { usuario } = useSesion();
  return (
    <Marco roles={["comercio"]} items={ITEMS} titulo="Panel de comercio" subtitulo={usuario?.nombre ?? "Mi negocio"}>
      {children}
    </Marco>
  );
}

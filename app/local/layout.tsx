"use client";

import { Marco, type ItemNav } from "@/components/marco";
import { useSesion } from "@/lib/sesion";

const ITEMS: ItemNav[] = [
  { href: "/local/caja", texto: "Caja", grupo: "Mostrador" },
  { href: "/local/cupones", texto: "Validar cupón", grupo: "Mostrador" },
  { href: "/local/pedidos", texto: "Pedidos PaseoYa", grupo: "Mostrador" },
  { href: "/local/movimientos", texto: "Movimientos", grupo: "Mi local" },
  { href: "/local/panel", texto: "Panel de clientes", grupo: "Mi local" },
  { href: "/local/productos", texto: "Productos PaseoYa", grupo: "Mi local", roles: ["gerente"] },
  { href: "/local/promociones", texto: "Promociones", grupo: "Mi local", roles: ["gerente"] },
  { href: "/local/qr", texto: "QR de la puerta", grupo: "Mi local", roles: ["gerente"] },
];

export default function LayoutLocal({ children }: { children: React.ReactNode }) {
  const { usuario } = useSesion();
  return (
    <Marco roles={["cajero", "gerente"]} items={ITEMS} titulo="Portal del local" subtitulo={usuario?.rol === "gerente" ? "Gerencia" : "Caja"}>
      {children}
    </Marco>
  );
}

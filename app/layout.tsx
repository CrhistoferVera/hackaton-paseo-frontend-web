import type { Metadata } from "next";
import { Bodoni_Moda, IBM_Plex_Mono, Inter, Montserrat } from "next/font/google";
import { ProveedorSesion } from "@/lib/sesion";
import "./globals.css";

const display = Bodoni_Moda({ variable: "--f-display", subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const senal = Montserrat({ variable: "--f-senal", subsets: ["latin"], weight: ["500", "600", "700"] });
const texto = Inter({ variable: "--f-texto", subsets: ["latin"], weight: ["400", "500", "600"] });
const dato = IBM_Plex_Mono({ variable: "--f-dato", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "Paseo Points", template: "%s · Paseo Points" },
  description: "Portal de locales y Centro de Inteligencia de Paseo Aranjuez",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${display.variable} ${senal.variable} ${texto.variable} ${dato.variable}`}>
      <body>
        <ProveedorSesion>{children}</ProveedorSesion>
      </body>
    </html>
  );
}

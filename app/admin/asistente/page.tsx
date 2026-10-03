"use client";

import { Cabecera } from "@/components/marco";
import { Preguntar } from "@/components/preguntar";

/** Asistente de datos a pantalla completa: conversación con memoria, tablas, gráficos y acciones. */
export default function Asistente() {
  return (
    <>
      <Cabecera
        ceja="Centro de Inteligencia"
        titulo="Asistente de datos"
        descripcion="Pregúntale en tus palabras: ventas, locales, horas, equidad del flujo, ofertas de la IA, promociones, eventos, clientes o fraude. Recuerda de qué venían hablando («¿y la semana pasada?», «¿y Napoli?») y te propone acciones que puedes ejecutar con un clic."
      />
      <div style={{ display: "flex", minHeight: "62vh", maxWidth: 980 }}>
        <Preguntar oscuro={false} />
      </div>
    </>
  );
}

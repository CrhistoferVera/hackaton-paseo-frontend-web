"use client";

import { Cabecera } from "@/components/marco";
import { Preguntar } from "@/components/preguntar";

/** Asistente de datos a pantalla completa: conversación con memoria, tablas, gráficos y acciones. */
export default function Asistente() {
  return (
    <>
      <Cabecera
        ceja="Inteligencia artificial a tu servicio"
        titulo="Tu asistente de inteligencia artificial"
        descripcion="Haz una pregunta sobre el Paseo. Convierte ventas, visitas y promociones en respuestas claras y próximos pasos."
      />
      <div className="asistente-espacio">
        <Preguntar oscuro />
      </div>
    </>
  );
}

# Paseo Points · Portal web

Portal de locales y Centro de Inteligencia de Paseo Aranjuez. Next.js 16 (App Router), React 19, Recharts y Socket.IO.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev
```

Abre `http://localhost:3000`. La API (`hackaton-paseo-backend`) debe estar corriendo; las cuentas de prueba están en su README.

## Pantallas por rol

### Panel de comercio (`/comercio`)

Una sola cuenta por negocio (rol `comercio`, por ejemplo `comercio.napolipizzeria@paseo.bo`) que maneja todo:

| Ruta | Qué hace |
| --- | --- |
| `/comercio/caja` | HU-L02 escanear el pase e ingresar el monto · HU-L03 identificar por celular y código · cola sin conexión (RNF-08) |
| `/comercio/cupones` | HU-L04 validar el cupón de canje |
| `/comercio/pedidos` | HU-Y14 bandeja en tiempo real · HU-Y15 entregar con QR o PIN |
| `/comercio/productos` | HU-Y13 agregar, editar y eliminar productos PaseoYa, con stock, tiempo de preparación y etiquetas (Jarvis los usa) |
| `/comercio/promociones` | HU-L11 crear promociones; retirar las pendientes o terminar hoy las aprobadas |
| `/comercio/drops` | Pedir un Drop (producto, precio especial, zona, fecha, duración, unidades) y seguir su estado |
| `/comercio/eventos` | Proponer eventos (degustación, taller, lanzamiento…); al aprobarse aparecen en la app y Jarvis los recomienda |
| `/comercio/movimientos` | HU-L06 movimientos por fecha, exportar CSV |
| `/comercio/panel` | HU-L08 panel · HU-L09 ranking · HU-L12 categorías · HU-Y16 ventas PaseoYa |
| `/comercio/qr` | HU-L07 QR de la puerta en PDF |

### Administración, marketing y analista (`/admin`)

| Ruta | Historias |
| --- | --- |
| `/admin/centro` | HU-A07 tablero en tiempo real · HU-A08 mapa de calor en gemelo isométrico y vista 2D · HU-A15 pregúntale a tus datos · HU-X03 eventos capturados · HU-X05 lanzar Drop · HU-X06 resumen del día |
| `/admin/horarios` | HU-A09 matriz día × hora |
| `/admin/segmentos` | HU-A10 RFM y segmentos K-Means |
| `/admin/afinidad` | HU-A11 cruce de compras |
| `/admin/embudo` | HU-A12 imanes y dependientes |
| `/admin/demanda` | HU-A13 demanda insatisfecha |
| `/admin/roi` | HU-A16 retorno de promociones y misiones |
| `/admin/cohortes` | HU-A19 retención por cohortes |
| `/admin/economia` | HU-A20 estado económico del programa |
| `/admin/paseoya` | HU-Y18 pedidos y tráfico inducido |
| `/admin/jarvis` | Jarvis proactivo: motores, latencia, órdenes de voz y grafo del edificio |
| `/admin/fraude` | HU-A14 alertas de fraude |
| `/admin/auditoria` | RNF-06 auditoría |
| `/admin/locales` | HU-A01 locales en el plano |
| `/admin/usuarios` | HU-A02 usuarios y roles |
| `/admin/reglas` | HU-A03 valor del punto y reglas |
| `/admin/recompensas` | HU-A04 catálogo de recompensas |
| `/admin/misiones` | HU-A05 constructor de misiones |
| `/admin/promociones` | HU-A06 aprobar promociones |
| `/admin/categorias` | HU-Y17 categorías · HU-Y19 destacados |
| `/admin/asistente` | Asistente de datos con memoria: tablas, gráficos y acciones de un clic (crear promociones, regenerar ofertas) |
| `/admin/ofertas` | Ofertas personales de la IA y equidad del flujo: Gini, locales sub y sobre atendidos, ajustes (peso de equidad, ofertas por cliente) |
| `/admin/eventos` | Agenda de eventos: crear, aprobar o rechazar propuestas de comercios, cancelar |
| `/admin/drops` | Drops · aprobar y lanzar las solicitudes de Drop de los comercios |
| `/admin/informacion` | Información para Jarvis: lo que Jarvis responde sobre temas generales (medios de pago, devoluciones…) y las preguntas que no pudo responder |

## Estructura

- `lib/api.ts`: único punto de acceso al backend.
- `lib/sesion.tsx`, `lib/tiempo-real.ts`, `lib/use-datos.ts`: sesión, Socket.IO y carga de datos.
- `components/`: marco por rol, gemelo digital (`plano.tsx`), lector QR, gráficos y la consola de preguntas.
- `app/globals.css`: sistema visual «Latón y plano» (papel, tinta y oro solo donde hay valor).
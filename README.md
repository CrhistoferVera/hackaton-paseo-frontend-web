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

### Cajero y gerente (`/local`)

| Ruta | Historias |
| --- | --- |
| `/local/caja` | HU-L02 escanear el pase e ingresar el monto · HU-L03 identificar por celular y código · cola sin conexión (RNF-08) |
| `/local/cupones` | HU-L04 validar el cupón de canje |
| `/local/pedidos` | HU-Y14 bandeja en tiempo real · HU-Y15 entregar con QR o PIN |
| `/local/movimientos` | HU-L06 movimientos por fecha y cajero, exportar CSV |
| `/local/panel` | HU-L08 panel · HU-L09 ranking · HU-L12 categorías · HU-Y16 ventas PaseoYa |
| `/local/productos` | HU-Y13 productos PaseoYa (gerente) |
| `/local/promociones` | HU-L11 promociones para horas flojas (gerente) |
| `/local/qr` | HU-L07 QR de la puerta en PDF (gerente) |

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
| `/admin/drops` | Drops y hitos AR |

## Estructura

- `lib/api.ts`: único punto de acceso al backend.
- `lib/sesion.tsx`, `lib/tiempo-real.ts`, `lib/use-datos.ts`: sesión, Socket.IO y carga de datos.
- `components/`: marco por rol, gemelo digital (`plano.tsx`), lector QR, gráficos y la consola de preguntas.
- `app/globals.css`: sistema visual «Latón y plano» (papel, tinta y oro solo donde hay valor).
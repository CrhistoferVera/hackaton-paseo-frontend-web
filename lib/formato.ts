/** Formatos bolivianos: Bs 45,00 · 2.480 pts · 18 % · 30 nov. */
const nf = (dec: number) => new Intl.NumberFormat("es-BO", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const bs = (n: number | string | null | undefined, dec = 2) => `Bs ${nf(dec).format(Number(n ?? 0))}`;
export const pts = (n: number | string | null | undefined) => `${nf(0).format(Number(n ?? 0))} pts`;
export const entero = (n: number | string | null | undefined) => nf(0).format(Number(n ?? 0));
export const pct = (n: number | string | null | undefined, dec = 1) => (n === null || n === undefined ? "—" : `${nf(dec).format(Number(n))} %`);

const ZONA = "America/La_Paz";
export const fecha = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("es-BO", { day: "numeric", month: "short", timeZone: ZONA }).replace(".", "") : "—";
export const fechaHora = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleString("es-BO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: ZONA }).replace(".", "") : "—";
export const hora = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", timeZone: ZONA }) : "—";
export const hoyIso = () => new Date(Date.now() - 4 * 3600_000).toISOString().slice(0, 10);
export const diasAtrasIso = (n: number) => new Date(Date.now() - 4 * 3600_000 - n * 86400_000).toISOString().slice(0, 10);
export const ubicacion = (l: { piso?: string; sector?: string; numero_local?: string }) =>
  [l.piso, l.sector ? `Sector ${l.sector}` : null, l.numero_local ? `Local ${l.numero_local}` : null].filter(Boolean).join(" · ");

export const ESTADO_PEDIDO: Record<string, string> = {
  recibido: "Pedido recibido",
  confirmado: "Confirmado",
  preparando: "Preparando",
  listo: "Listo para recoger",
  cliente_llego: "Cliente llegó",
  entregado: "Entregado",
  vencido: "Vencido",
};

export const REGLA_FRAUDE: Record<string, string> = {
  monto_atipico: "Monto atípico",
  rafaga_compras: "Ráfaga de compras",
  par_cliente_cajero: "Par cliente-cajero",
  modelo_anomalias: "Modelo de anomalías",
  canje_tras_sospecha: "Canje tras sospecha",
};

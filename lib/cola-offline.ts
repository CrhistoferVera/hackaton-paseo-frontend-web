"use client";

/**
 * Cola local de compras para cuando la caja se queda sin red (RNF-08).
 * Cada compra conserva su clave de idempotencia y su hora de captura: al reenviarla,
 * el servidor valida el pase contra esa hora y no la acredita dos veces.
 */
const CLAVE = "pp.cola-compras";

export interface CompraPendiente {
  claveIdempotencia: string;
  capturadoEn: string;
  pase?: string;
  clienteId?: string;
  codigoCliente?: string;
  montoBs: number;
  categoria?: string | null;
  nroFactura?: string | null;
  nombre?: string;
}

export function leerCola(): CompraPendiente[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
  } catch {
    return [];
  }
}

function guardar(c: CompraPendiente[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(c));
  } catch {
    /* sin almacenamiento */
  }
}

export function encolar(c: CompraPendiente) {
  guardar([...leerCola().filter((x) => x.claveIdempotencia !== c.claveIdempotencia), c]);
}

export function quitar(clave: string) {
  guardar(leerCola().filter((x) => x.claveIdempotencia !== clave));
}

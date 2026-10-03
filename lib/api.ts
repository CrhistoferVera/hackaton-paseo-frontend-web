/**
 * Cliente HTTP del backend (capa de acceso a datos del frontend).
 * Las pantallas nunca llaman a fetch directamente: usan este cliente o los servicios de lib/servicios.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const CLAVE_TOKEN = "pp.token";

export class ErrorApi extends Error {
  constructor(public readonly estado: number, mensaje: string, public readonly datos?: unknown) {
    super(mensaje);
  }
}

export function leerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

export function guardarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    /* almacenamiento no disponible */
  }
}

type Opciones = { metodo?: string; cuerpo?: unknown; formulario?: FormData; senal?: AbortSignal };

export async function api<T = any>(ruta: string, op: Opciones = {}): Promise<T> {
  const token = leerToken();
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (op.cuerpo !== undefined) headers["content-type"] = "application/json";
  let r: Response;
  try {
    r = await fetch(`${API_URL}${ruta}`, {
      method: op.metodo ?? (op.cuerpo !== undefined || op.formulario ? "POST" : "GET"),
      headers,
      body: op.formulario ?? (op.cuerpo !== undefined ? JSON.stringify(op.cuerpo) : undefined),
      signal: op.senal,
    });
  } catch {
    throw new ErrorApi(0, "No hay conexión con el servidor de Paseo Points");
  }
  const texto = await r.text();
  let datos: any = texto;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    /* respuesta no JSON */
  }
  if (!r.ok) {
    if (r.status === 401 && token) {
      guardarToken(null);
      if (typeof window !== "undefined" && !location.pathname.startsWith("/login")) location.assign(new URL("/login?expirada=1", location.origin).href);
    }
    const msg = Array.isArray(datos?.message) ? datos.message.join(". ") : datos?.message ?? `Error ${r.status}`;
    throw new ErrorApi(r.status, msg, datos);
  }
  return datos as T;
}

/** Descarga un archivo protegido (PDF, CSV) con la sesión actual. */
export async function descargar(ruta: string, nombre: string) {
  const r = await fetch(`${API_URL}${ruta}`, { headers: { authorization: `Bearer ${leerToken()}` } });
  if (!r.ok) throw new ErrorApi(r.status, "No se pudo descargar el archivo");
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const urlArchivo = (ruta?: string | null) => (ruta ? (ruta.startsWith("http") ? ruta : `${API_URL}${ruta}`) : null);

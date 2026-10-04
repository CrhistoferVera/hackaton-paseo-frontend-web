"use client";

import { useCallback, useEffect, useState } from "react";
import { Cabecera, Mensajes, Seccion } from "@/components/marco";
import { EscanerQR } from "@/components/escaner-qr";
import { api, ErrorApi } from "@/lib/api";
import { encolar, leerCola, quitar, type CompraPendiente } from "@/lib/cola-offline";
import { bs, fechaHora, hora, pts } from "@/lib/formato";
import { useTiempoReal } from "@/lib/tiempo-real";
import { useDatos } from "@/lib/use-datos";

interface Cliente {
  clienteId: string;
  nombre: string;
  nivel: string;
  comprasEnEsteLocal: number;
  promocion: { titulo: string; multiplicador: number } | null;
  bsPorPunto: number;
}

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫"];

/** HU-L02 y HU-L03: escanear el pase (o ingresar su código único), ingresar el monto y acreditar. */
export default function Caja() {
  const { datos: local } = useDatos<any>("/local/mi-local");
  const { datos: recientes, recargar } = useDatos<any[]>("/local/compras/recientes");
  const [modo, setModo] = useState<"qr" | "codigo">("qr");
  const [pase, setPase] = useState<string | null>(null);
  const [identificado, setIdentificado] = useState<{ codigo: string } | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState<string>("");
  const [factura, setFactura] = useState("");
  const [codigo6, setCodigo6] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<any | null>(null);
  const [cola, setCola] = useState<CompraPendiente[]>([]);
  const [enLinea, setEnLinea] = useState(true);

  useEffect(() => {
    setCola(leerCola());
    setEnLinea(navigator.onLine);
  }, []);
  useEffect(() => {
    if (local?.categoria && !categoria) setCategoria(local.categoria);
  }, [local, categoria]);

  useTiempoReal({ compra: () => void recargar() });

  const reiniciar = () => {
    setPase(null);
    setIdentificado(null);
    setCliente(null);
    setMonto("");
    setFactura("");
    setCodigo6("");
    setError(null);
  };

  const leerPase = useCallback(async (texto: string) => {
    setError(null);
    setResultado(null);
    try {
      const c = await api<Cliente>("/local/clientes/pase", { cuerpo: { pase: texto } });
      setPase(texto);
      setCliente(c);
    } catch (e: any) {
      if (e instanceof ErrorApi && e.estado === 0 && /^PP1:/.test(texto)) {
        // Sin red: se acepta el pase y se valida al reconectar
        setPase(texto);
        setCliente({ clienteId: "", nombre: "Cliente (sin conexión)", nivel: "—", comprasEnEsteLocal: 0, promocion: null, bsPorPunto: 1 });
      } else setError(e.message);
    }
  }, []);

  async function confirmarCodigo(e: React.FormEvent) {
    e.preventDefault(); setError(null); setResultado(null);
    try {
      const codigo = codigo6.trim();
      const c = await api<Cliente>('/local/clientes/codigo', {cuerpo:{codigo}});
      setIdentificado({codigo}); setPase(null); setCliente(c);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'No se pudo verificar el código'); }
  }

  const enviarCompra = useCallback(async (c: CompraPendiente) => {
    const r = await api("/local/compras", {
      cuerpo: {
        claveIdempotencia: c.claveIdempotencia,
        capturadoEn: c.capturadoEn,
        pase: c.pase,
        clienteId: c.clienteId,
        codigoCliente: c.codigoCliente,
        montoBs: c.montoBs,
        categoria: c.categoria,
        nroFactura: c.nroFactura || null,
        offline: !!c.nombre?.includes("sin conexión"),
      },
    });
    quitar(c.claveIdempotencia);
    setCola(leerCola());
    return r;
  }, []);

  // Reenvío automático de la cola al recuperar la red
  useEffect(() => {
    const vaciar = async () => {
      setEnLinea(navigator.onLine);
      for (const c of leerCola()) {
        try {
          await enviarCompra({ ...c, nombre: "sin conexión" });
        } catch (e: any) {
          if (e instanceof ErrorApi && e.estado === 0) break;
          quitar(c.claveIdempotencia);
          setError(`Una compra guardada sin conexión fue rechazada: ${e.message}`);
        }
      }
      setCola(leerCola());
      void recargar();
    };
    const offline = () => setEnLinea(false);
    window.addEventListener("online", vaciar);
    window.addEventListener("offline", offline);
    const t = setInterval(() => leerCola().length && navigator.onLine && void vaciar(), 15000);
    return () => {
      window.removeEventListener("online", vaciar);
      window.removeEventListener("offline", offline);
      clearInterval(t);
    };
  }, [enviarCompra, recargar]);

  const montoNum = Number(monto.replace(",", ".")) || 0;
  const estimado = cliente ? Math.floor((montoNum / (cliente.bsPorPunto || 1)) * (cliente.promocion?.multiplicador ?? 1)) : 0;

  function tecla(t: string) {
    if (t === "⌫") return setMonto((m) => m.slice(0, -1));
    if (t === ",") return setMonto((m) => (m.includes(",") ? m : (m || "0") + ","));
    setMonto((m) => {
      const [, dec] = m.split(",");
      if (dec && dec.length >= 2) return m;
      return (m === "0" ? "" : m) + t;
    });
  }

  async function acreditar() {
    if (!cliente || montoNum <= 0) return;
    const compra: CompraPendiente = {
      claveIdempotencia: crypto.randomUUID(),
      capturadoEn: new Date().toISOString(),
      pase: pase ?? undefined,
      codigoCliente: identificado?.codigo,
      montoBs: montoNum,
      categoria,
      nroFactura: factura || null,
      nombre: cliente.nombre,
    };
    setEnviando(true);
    setError(null);
    encolar(compra); // se guarda antes de enviar: si la red falla, no se pierde
    try {
      const r = await enviarCompra(compra);
      setResultado(r);
      reiniciar();
      void recargar();
    } catch (e: any) {
      if (e instanceof ErrorApi && e.estado === 0) {
        setResultado({ pendiente: true, montoBs: montoNum, cliente: { nombre: cliente.nombre } });
        setCola(leerCola());
        reiniciar();
      } else {
        quitar(compra.claveIdempotencia);
        setError(e.message);
      }
    } finally {
      setEnviando(false);
    }
  }

  const categorias = [local?.categoria, "Bebidas", "Promoción", "Otros"].filter((c, i, a) => c && a.indexOf(c) === i) as string[];

  return (
    <>
      <Cabecera ceja={local ? `${local.nombre} · ${local.piso} · Local ${local.numero_local}` : "Caja"} titulo="Registrar compra" descripcion="Escanea el QR o ingresa el código único del cliente, ingresa el monto y acredita. Los puntos aparecen en su celular al instante.">
        <span className={`etiqueta ${enLinea ? "exito" : "alerta"}`}>{enLinea ? "En línea" : "Sin conexión"}</span>
        {cola.length > 0 && <span className="etiqueta oro">{cola.length} por enviar</span>}
      </Cabecera>

      {resultado && (
        <div className="aviso exito" style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <span>
            {resultado.pendiente ? (
              <>Compra de {bs(resultado.montoBs)} guardada en este equipo. Se enviará sola al recuperar la conexión.</>
            ) : (
              <>
                Acreditaste <b className="oro">{pts(resultado.puntos)}</b> a {resultado.cliente?.nombre} por {bs(resultado.montoBs)}
                {resultado.detalle?.length ? ` (${resultado.detalle.join(", ")})` : ""}.
              </>
            )}
          </span>
          <button className="enlace" onClick={() => setResultado(null)}>Cerrar</button>
        </div>
      )}

      <div className="dos-col">
        <div>
          {!cliente ? (
            <>
              <div className="segmentado" style={{ marginBottom: 18 }}>
                <button className={modo === "qr" ? "on" : ""} onClick={() => setModo("qr")}>Escanear pase</button>
                <button className={modo === "codigo" ? "on" : ""} onClick={() => setModo("codigo")}>Código único</button>
              </div>
              {modo === "qr" ? (
                <EscanerQR onLeido={leerPase} etiqueta="Abrir cámara" />
              ) : (
                <form onSubmit={confirmarCodigo} style={{display:'grid',gap:12}}>
                  <label className="campo"><span>Código único que muestra el cliente en su pase</span><input autoComplete="off" autoCapitalize="characters" maxLength={15} placeholder="ABCDEFGH:123456" value={codigo6} onChange={e => setCodigo6(e.target.value.toUpperCase().replace(/[^A-Z0-9:]/g,''))} /></label>
                  <button className="btn" disabled={!/^[A-Z0-9]{8}:\d{6}$/.test(codigo6)}>Verificar cliente</button>
                </form>
              )}
            </>
          ) : (
            <div>
              <span className="senal muted">Cliente</span>
              <div className="display" style={{ fontSize: 34, margin: "4px 0 6px" }}>{cliente.nombre}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {cliente.nivel && <span className="etiqueta oro">{cliente.nivel}</span>}
                <span className="etiqueta exito">{identificado ? "Identificado por código" : "Pase verificado"}</span>
                {cliente.comprasEnEsteLocal > 0 && <span className="etiqueta tenue">{cliente.comprasEnEsteLocal} compras aquí</span>}
              </div>
              {cliente.promocion && (
                <div className="aviso" style={{ marginBottom: 16 }}>
                  Promoción activa: <b>{cliente.promocion.titulo}</b> (puntos ×{cliente.promocion.multiplicador})
                </div>
              )}
              <button className="enlace" onClick={reiniciar}>Cambiar cliente</button>
            </div>
          )}
          <Mensajes error={error} />
        </div>

        <div style={{ opacity: cliente ? 1 : 0.45, pointerEvents: cliente ? "auto" : "none" }} aria-disabled={!cliente}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid var(--tinta)", paddingBottom: 10 }}>
            <div>
              <span className="senal muted">Monto de la compra</span>
              <div className="cifra" style={{ fontSize: 56 }}>Bs {monto || "0"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className="muted" style={{ fontSize: 13 }}>Suma</span>
              <div className="cifra oro" style={{ fontSize: 26 }}>{pts(estimado)}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderLeft: "1px solid var(--linea)", borderTop: "1px solid var(--linea)", marginTop: 14 }}>
            {TECLAS.map((t) => (
              <button key={t} type="button" onClick={() => tecla(t)} style={{ height: 54, fontSize: 20, background: "transparent", border: 0, borderRight: "1px solid var(--linea)", borderBottom: "1px solid var(--linea)", cursor: "pointer", fontVariantNumeric: "tabular-nums" }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
            <div className="campo">
              <span>Categoría</span>
              <div className="segmentado" style={{ flexWrap: "wrap" }}>
                {categorias.map((c) => (
                  <button key={c} type="button" className={categoria === c ? "on" : ""} onClick={() => setCategoria(c)}>{c}</button>
                ))}
              </div>
            </div>
            <label className="campo">
              <span>N.º de factura (opcional)</span>
              <input value={factura} onChange={(e) => setFactura(e.target.value)} />
            </label>
            <button className="btn grande" onClick={acreditar} disabled={!cliente || montoNum <= 0 || enviando}>
              {enviando ? "Acreditando…" : `Acreditar ${pts(estimado)}${cliente ? ` a ${cliente.nombre}` : ""}`}
            </button>
          </div>
        </div>
      </div>

      <Seccion titulo="Últimas compras del local">
        {!recientes?.length ? (
          <div className="vacio">Todavía no hay compras hoy.</div>
        ) : (
          <div className="tabla-envoltura">
            <table className="libro">
              <thead>
                <tr><th>Hora</th><th>Cliente</th><th className="der">Monto</th><th className="der">Puntos</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {recientes.map((c) => (
                  <tr key={c.id}>
                    <td title={fechaHora(c.creado_en)}>{hora(c.creado_en)}</td>
                    <td>{c.cliente}</td>
                    <td className="der">{bs(c.monto_bs)}</td>
                    <td className="der oro">{c.puntos}</td>
                    <td>{c.estado === "anulada" ? <span className="etiqueta alerta">Anulada</span> : <span className="etiqueta tenue">Válida</span>}</td>
                  </tr>
                ))}
                {cola.map((c) => (
                  <tr key={c.claveIdempotencia}>
                    <td>{hora(c.capturadoEn)}</td>
                    <td>{c.nombre}</td>
                    <td className="der">{bs(c.montoBs)}</td>
                    <td className="der">—</td>
                    <td><span className="etiqueta oro">Por enviar</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Seccion>
    </>
  );
}

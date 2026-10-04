"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Cabecera, Cargando, Indicador, Mensajes, PanelLateral } from "@/components/marco";
import { MapaInteractivo } from "@/components/mapa-interactivo";
import { Guia } from "@/components/admin-ui";
import { GemeloIso, Plano2D, nivelesPlano, type Plano, type Zona } from "@/components/plano";
import { bs, diasAtrasIso, entero, hoyIso } from "@/lib/formato";
import { useTiempoReal } from "@/lib/tiempo-real";
import { useDatos } from "@/lib/use-datos";
const CAPAS = { visitas: "Visitas registradas", ventas: "Ventas en Bs", permanencia: "Permanencia en minutos" };
export default function Centro() {
  const { datos: plano, error: errorPlano } = useDatos<Plano>("/recinto/plano");
  const { datos: t, recargar: tablero, error } = useDatos<any>("/admin/inteligencia/tablero");
  const niveles = plano ? nivelesPlano(plano) : [];
  const [capa, setCapa] = useState<keyof typeof CAPAS>("visitas");
  const [rango, setRango] = useState("semana");
  const [piso, setPiso] = useState("todo");
  const [vista, setVista] = useState("3d");
  const [zona, setZona] = useState<Zona | null>(null);
  const {
    datos: calor,
    recargar,
    error: errorCalor,
  } = useDatos<any>(
    "/admin/inteligencia/calor?metrica=" +
      capa +
      "&desde=" +
      (rango === "hoy" ? hoyIso() : diasAtrasIso(6)) +
      "&hasta=" +
      hoyIso(),
  );
  const pendiente = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (pendiente.current) clearTimeout(pendiente.current); }, []);
  const refrescar = () => {
    if (pendiente.current) return;
    pendiente.current = setTimeout(() => {
      pendiente.current = null;
      void tablero();
      void recargar();
    }, 2500);
  };
  useTiempoReal({ evento: refrescar, connect: refrescar });

  const valores = useMemo(
    () => new Map<string, number>((calor?.zonas ?? []).map((z: any) => [z.zona_id, Number(z.valor)])),
    [calor],
  );
  const locales = useMemo(
    () => new Map<string, number>((calor?.locales ?? []).map((l: any) => [l.local_id, Number(l.valor)])),
    [calor],
  );
  return (
    <>
      <Cabecera
        ceja="Entender el Paseo"
        titulo="Gemelo digital"
        descripcion="Una vista del edificio para entender dónde se concentra la actividad."
      />
      <Mensajes error={error || errorPlano || errorCalor} />
      {t && (
        <div className="indicadores">
          <Indicador etiqueta="Visitantes hoy" valor={entero(t.visitantes_hoy)} detalle="Personas con llegada registrada" />
          <Indicador
            etiqueta="Ventas hoy"
            valor={bs(t.ventas_hoy, 0)}
            detalle={entero(t.compras_hoy) + " compras registradas"}
            oro
          />
          <Indicador
            etiqueta="Usuarios activos"
            valor={entero(t.usuarios_activos)}
            detalle="App abierta en los últimos 60 minutos"
          />
        </div>
      )}
      {plano && <div className="mapa-resumen"><span><strong>{plano.locales.length}</strong> locales registrados</span><span><strong>{niveles.length}</strong> niveles</span><span><strong>{plano.locales.filter(l=>l.activo).length}</strong> activos</span><span>Ubicaciones del sistema</span></div>}
      <Guia titulo="Cómo leer el mapa">
        Elige qué quieres observar y un período. El color más intenso indica mayor actividad registrada, no el aforo real.
        Selecciona una zona para ver sus locales.
      </Guia>
      <div className="admin-toolbar">
        <label className="campo">
          <span>Qué observar</span>
          <select value={capa} onChange={(e) => setCapa(e.target.value as keyof typeof CAPAS)}>
            {Object.entries(CAPAS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Período del mapa</span>
          <select value={rango} onChange={(e) => setRango(e.target.value)}>
            <option value="hoy">Hoy</option>
            <option value="semana">Últimos 7 días</option>
          </select>
        </label>
        <label className="campo">
          <span>Nivel</span>
          <select value={piso} onChange={(e) => setPiso(e.target.value)}>
            <option value="todo">Todos los niveles</option>
            {niveles.map(n=><option key={n.id} value={n.id}>{n.nombre} · {plano?.locales.filter(l=>l.piso===n.id).length} locales</option>)}
          </select>
        </label>
        <div className="segmentado">
          {["3d", "2d"].map((v) => (
            <button key={v} aria-pressed={vista === v} className={vista === v ? "on" : ""} onClick={() => setVista(v)}>
              Vista {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {!plano || !calor ? (
        <Cargando />
      ) : (
        <div className="mapa-admin">
          <MapaInteractivo key={vista + piso} nombre="Mapa de actividad por nivel">
            {vista === "3d" ? (
              <GemeloIso
                plano={plano}
                valorZona={valores}
                maxZona={calor.max ?? 1}
                pulsos={new Map()}
                ahora={0}
                pisoVisible={piso}
                zonaSeleccionada={zona?.id}
                onZona={setZona}
                unidad={CAPAS[capa]}
              />
            ) : (
              <Plano2D
                oscuro
                plano={plano}
                piso={piso === "todo" ? niveles[0]?.id ?? "" : piso}
                valorZona={valores}
                valorLocal={locales}
                maxZona={calor.max ?? 1}
                maxLocal={calor.maxLocal ?? 1}
              />
            )}
          </MapaInteractivo>
          <p className="muted">
            {vista === "2d" && piso === "todo" ? `Vista 2D: mostrando ${niveles[0]?.nombre ?? "ningún nivel registrado"}. Elige otro nivel arriba. · ` : ""}
            {CAPAS[capa]} · Menor actividad{" "}
            <span
              style={{
                display: "inline-block",
                width: 100,
                height: 8,
                background: "linear-gradient(90deg,#5a5a5a,#ad831e,#f4b41a)",
                margin: "0 8px",
              }}
            />{" "}
            Mayor actividad
          </p>
          <div className="admin-toolbar">
            {plano.zonas
              .filter((z) => piso === "todo" || z.piso === piso)
              .map((z) => (
                <button className="btn claro chico" key={z.id} onClick={() => setZona(z)}>
                  {z.nombre} · {capa === "ventas" ? bs(valores.get(z.id) ?? 0, 0) : entero(valores.get(z.id) ?? 0)}
                </button>
              ))}
          </div>
        </div>
      )}
      <PanelLateral abierto={!!zona} titulo={zona?.nombre ?? "Zona"} onCerrar={() => setZona(null)}>
        {zona && (
          <>
            <p className="ceja">
              {zona.piso} · {CAPAS[capa]}
            </p>
            <p className="cifra" style={{ fontSize: 42 }}>
              {capa === "ventas" ? bs(valores.get(zona.id) ?? 0) : entero(valores.get(zona.id) ?? 0)}
            </p>
            <h3>Locales de esta zona</h3>
            {plano?.locales
              .filter((l) => l.zona_id === zona.id)
              .map((l) => (
                <div className="tarjeta-admin" key={l.id}>
                  {l.nombre}
                  <p>
                    {l.categoria} · Local {l.numero_local}
                  </p>
                </div>
              ))}
          </>
        )}
      </PanelLateral>
    </>
  );
}

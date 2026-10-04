"use client";
import { useState } from "react";
import { Cabecera, Cargando, Mensajes, Seccion } from "@/components/marco";
import { Guia, ListaPaginada } from "@/components/admin-ui";
import { bs, entero, pct } from "@/lib/formato";
import { useDatos } from "@/lib/use-datos";
export default function Afinidad() {
  const [modo, setModo] = useState("mes");
  const [vista, setVista] = useState("cruces");
  const { datos, error } = useDatos<any>("/admin/inteligencia/afinidad?modo=" + modo + "&top=12");
  const { datos: flujo, error: errorFlujo } = useDatos<any[]>("/admin/inteligencia/embudo?dias=30");
  const pares: { a: string; b: string; v: number }[] = [];
  datos?.matriz?.forEach((fila: (number | null)[], i: number) =>
    fila.forEach((v, j) => {
      if (v !== null && i !== j) pares.push({ a: datos.locales[i].nombre, b: datos.locales[j].nombre, v: Number(v) });
    }),
  );
  pares.sort((a, b) => b.v - a.v);
  return (
    <>
      <Cabecera
        ceja="Relaciones entre locales · últimos 30 días"
        titulo="Cruce de compras"
        descripcion="Entiende qué locales comparten clientes y cuáles atraen la primera visita."
      />
      <Mensajes error={error || errorFlujo} />
      <div className="admin-toolbar segmentado">
        <button className={vista === "cruces" ? "on" : ""} onClick={() => setVista("cruces")}>
          Compras compartidas
        </button>
        <button className={vista === "flujo" ? "on" : ""} onClick={() => setVista("flujo")}>
          Atracción de visitas
        </button>
      </div>
      {vista === "cruces" ? (
        <>
          <Guia titulo="Cómo interpretar una relación">
            El porcentaje se lee en una dirección: de quienes compraron en el local de origen, cuántos también compraron en el
            destino. Es una oportunidad para explorar promociones conjuntas; no demuestra que un local cause la compra en otro.
          </Guia>
          <div className="segmentado">
            <button className={modo === "mes" ? "on" : ""} onClick={() => setModo("mes")}>
              En el mismo mes
            </button>
            <button className={modo === "visita" ? "on" : ""} onClick={() => setModo("visita")}>
              En la misma visita
            </button>
          </div>
          {!datos ? (
            <Cargando />
          ) : (
            <>
              <div className="resumen-tarjetas">
                {pares.slice(0, 3).map((p) => (
                  <article className="tarjeta-admin" key={p.a + p.b}>
                    <span className="ceja">Oportunidad de colaboración</span>
                    <h3>
                      {p.a} → {p.b}
                    </h3>
                    <strong className="cifra oro" style={{ fontSize: 36 }}>
                      {pct(p.v)}
                    </strong>
                    <p>
                      de los clientes de {p.a} también compran en {p.b}.
                    </p>
                  </article>
                ))}
              </div>
              <Seccion titulo="Relaciones entre comercios">
                <ListaPaginada key={modo} datos={pares} nombre="relaciones">
                  {(filas) => (
                    <table className="libro">
                      <thead>
                        <tr>
                          <th>Compran en</th>
                          <th>También compran en</th>
                          <th>Clientes compartidos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filas.map((p) => (
                          <tr key={p.a + p.b}>
                            <td>{p.a}</td>
                            <td>{p.b}</td>
                            <td>
                              <b>{pct(p.v)}</b>
                              <div className="barra">
                                <i style={{ width: p.v + "%" }} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </ListaPaginada>
                <p className="muted">12 locales con más clientes. Se ocultan relaciones con menos de 5 clientes en común.</p>
              </Seccion>
            </>
          )}
        </>
      ) : (
        <>
          <Guia titulo="Imanes y locales que reciben visitas compartidas">
            Un imán suele ser la primera parada registrada. Un local dependiente recibe principalmente personas que ya visitaron
            otro comercio. Esta clasificación describe recorridos; no mide la calidad del negocio.
          </Guia>
          {!flujo ? (
            <Cargando />
          ) : (
            <ListaPaginada<any> datos={flujo} nombre="locales">
              {(filas) => (
                <table className="libro">
                  <thead>
                    <tr>
                      <th>Local</th>
                      <th>Papel en la visita</th>
                      <th>Primera parada</th>
                      <th>Visitas QR</th>
                      <th>Visitas con compra</th>
                      <th>Ventas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <b>{d.nombre}</b>
                          <small>{d.categoria}</small>
                        </td>
                        <td>
                          <span className={d.rol === "imán" ? "etiqueta exito" : "etiqueta"}>
                            {d.rol === "dependiente" ? "Recibe visitas compartidas" : d.rol}
                          </span>
                        </td>
                        <td>{pct(d.primera_parada_pct, 0)}</td>
                        <td>{entero(d.checkins)}</td>
                        <td>{pct(d.conversion, 0)}</td>
                        <td>{bs(d.ventas, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </ListaPaginada>
          )}
        </>
      )}
    </>
  );
}

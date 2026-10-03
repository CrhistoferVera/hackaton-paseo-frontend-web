"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const EJE = { fontSize: 11, fill: "#5f594f", fontFamily: "var(--f-texto)" };
const tooltipEstilo = { contentStyle: { borderRadius: 2, border: "1px solid #cbc2b2", fontSize: 12, background: "#fbfaf7" }, cursor: { fill: "rgba(201,154,58,.08)" } };

export function Barras({ datos, x, y, alto = 260, color = "#16140f", oscuro = false, formato }: { datos: any[]; x: string; y: string; alto?: number; color?: string; oscuro?: boolean; formato?: (v: number) => string }) {
  const eje = oscuro ? { ...EJE, fill: "#9a9182" } : EJE;
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <BarChart data={datos} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid vertical={false} stroke={oscuro ? "#2c2821" : "#e4ded3"} />
        <XAxis dataKey={x} tick={eje} tickLine={false} axisLine={{ stroke: oscuro ? "#2c2821" : "#cbc2b2" }} interval={0} angle={datos.length > 8 ? -30 : 0} textAnchor={datos.length > 8 ? "end" : "middle"} height={datos.length > 8 ? 60 : 30} />
        <YAxis tick={eje} tickLine={false} axisLine={false} width={56} tickFormatter={formato} />
        <Tooltip {...tooltipEstilo} formatter={(v: any) => (formato ? formato(Number(v)) : v)} />
        <Bar dataKey={y} fill={color} radius={[1, 1, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Linea({ datos, x, series, alto = 240, formato }: { datos: any[]; x: string; series: { clave: string; color: string; nombre?: string }[]; alto?: number; formato?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <LineChart data={datos} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid vertical={false} stroke="#e4ded3" />
        <XAxis dataKey={x} tick={EJE} tickLine={false} axisLine={{ stroke: "#cbc2b2" }} minTickGap={20} />
        <YAxis tick={EJE} tickLine={false} axisLine={false} width={56} tickFormatter={formato} />
        <Tooltip {...tooltipEstilo} formatter={(v: any) => (formato ? formato(Number(v)) : v)} />
        {series.map((s) => (
          <Line key={s.clave} type="monotone" dataKey={s.clave} name={s.nombre ?? s.clave} stroke={s.color} strokeWidth={1.6} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Area1({ datos, x, y, alto = 200, color = "#c99a3a" }: { datos: any[]; x: string; y: string; alto?: number; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <AreaChart data={datos} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id="relleno" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity={0.35} />
            <stop offset="1" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#e4ded3" />
        <XAxis dataKey={x} tick={EJE} tickLine={false} axisLine={{ stroke: "#cbc2b2" }} minTickGap={20} />
        <YAxis tick={EJE} tickLine={false} axisLine={false} width={48} />
        <Tooltip {...tooltipEstilo} />
        <Area type="monotone" dataKey={y} stroke={color} strokeWidth={1.6} fill="url(#relleno)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { A } from "../../components/a";

const data = [
  // 2000-2005: Infrastructure abstractions era (OS-level abstractions, hardware virtualization starts)
  { year: "2000", infrastructure: 10, virtual: 0, cloud: 0, orchestration: 0, ai: 0 },
  { year: "2002", infrastructure: 25, virtual: 5, cloud: 0, orchestration: 0, ai: 0 },
  { year: "2004", infrastructure: 35, virtual: 12, cloud: 0, orchestration: 0, ai: 0 },
  
  // 2005-2010: Virtualization peaks (VMware ESX 2001, but widespread 2005+)
  { year: "2006", infrastructure: 55, virtual: 32, cloud: 0, orchestration: 0, ai: 0 },
  { year: "2008", infrastructure: 70, virtual: 55, cloud: 8, orchestration: 0, ai: 0 },
  { year: "2010", infrastructure: 75, virtual: 80, cloud: 30, orchestration: 0, ai: 0 },
  
  // 2010-2015: Cloud computing takes over (AWS 2006 but mainstream 2010+)
  { year: "2012", infrastructure: 72, virtual: 85, cloud: 55, orchestration: 0, ai: 0 },
  { year: "2013", infrastructure: 65, virtual: 82, cloud: 68, orchestration: 5, ai: 0 },
  { year: "2015", infrastructure: 55, virtual: 75, cloud: 85, orchestration: 30, ai: 0 },
  
  // 2015-2020: Container orchestration era (Docker 2013, Kubernetes 2014, mainstream 2017+)
  { year: "2017", infrastructure: 50, virtual: 70, cloud: 92, orchestration: 65, ai: 0 },
  { year: "2019", infrastructure: 48, virtual: 68, cloud: 95, orchestration: 90, ai: 0 },
  { year: "2021", infrastructure: 46, virtual: 66, cloud: 93, orchestration: 92, ai: 0 },
  
  // 2022-2025: AI era begins (ChatGPT Nov 2022, AI Platform Engineering starts)
  { year: "2022", infrastructure: 45, virtual: 64, cloud: 91, orchestration: 88, ai: 5 },
  { year: "2023", infrastructure: 44, virtual: 63, cloud: 90, orchestration: 85, ai: 35 },
  { year: "2024", infrastructure: 43, virtual: 62, cloud: 89, orchestration: 82, ai: 65 },
  { year: "2025", infrastructure: 42, virtual: 61, cloud: 88, orchestration: 80, ai: 85 },
];

const CustomLegend = (props: any) => {
  const { payload, isDark } = props;

  // Recharts reverses the order, so we need to display them in chronological order
  const chronologicalOrder = [
    { key: "infrastructure", label: "Infrastructure Abstractions (2000)", year: "2000" },
    { key: "virtual", label: "Virtualization (2005)", year: "2005" },
    { key: "cloud", label: "Cloud Computing (2010)", year: "2010" },
    { key: "orchestration", label: "Container Orchestration (2015)", year: "2015" },
    { key: "ai", label: "AI Platform Engineering (2022)", year: "2022" },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-x-7 gap-y-3 mt-6">
      {chronologicalOrder.map((item, index: number) => {
        const entry = payload.find((p: any) => p.value === item.key) || payload[index];

        return (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <span
              className={`font-mono text-xs whitespace-nowrap`}
              style={{
                color: entry?.color || undefined,
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-lg p-3 font-mono text-xs">
        <p className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p
            key={`tooltip-${index}`}
            style={{ color: entry.color }}
            className="mb-1"
          >
            {entry.name}: {entry.value}% adoption
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function Chart() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    setIsDark(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div className="relative my-12 lg:-mx-20 overflow-x-auto">
      <style jsx>{`
        .chart-container :global(svg) {
          outline: none !important;
        }
      `}</style>
      <div className="chart-container w-full max-w-4xl mx-auto border border-neutral-300 dark:border-neutral-700 p-3 sm:p-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#e5e5e5"} />
            <XAxis
              dataKey="year"
              className="text-xs"
              tick={{ fill: isDark ? "#737373" : "#666666" }}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={value => `${value}%`}
              className="text-xs"
              tick={{ fill: isDark ? "#737373" : "#666666" }}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend isDark={isDark} payload={[
              { value: "infrastructure", color: "#3b82f6" },  // 2000
              { value: "virtual", color: "#8b5cf6" },         // 2005
              { value: "cloud", color: "#06b6d4" },           // 2010
              { value: "orchestration", color: "#10b981" },   // 2015
              { value: "ai", color: "#f59e0b" },              // 2022
            ]} />} />
            <Line
              type="monotone"
              dataKey="infrastructure"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Infrastructure Abstractions"
              strokeOpacity={0.9}
            />
            <Line
              type="monotone"
              dataKey="virtual"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              name="Virtualization"
              strokeOpacity={0.9}
            />
            <Line
              type="monotone"
              dataKey="cloud"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              name="Cloud Computing"
              strokeOpacity={0.9}
            />
            <Line
              type="monotone"
              dataKey="orchestration"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Container Orchestration"
              strokeOpacity={0.9}
            />
            <Line
              type="monotone"
              dataKey="ai"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="AI Platform Engineering"
              strokeOpacity={0.9}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center mt-4 px-4 font-mono text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        Platform Engineering evolution: 25 years from infrastructure abstractions to AI platform engineering
      </p>
    </div>
  );
}


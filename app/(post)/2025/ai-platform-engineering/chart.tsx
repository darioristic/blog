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
  // 1990-2000: Bare metal era - physical servers, no abstraction layers yet
  { year: "1990", infrastructure: 3, virtual: 0, cloud: 0, orchestration: 0, ai: null },
  { year: "1995", infrastructure: 8, virtual: 0, cloud: 0, orchestration: 0, ai: null },
  
  // 2000-2010: Infrastructure abstractions era begins
  { year: "2000", infrastructure: 15, virtual: 3, cloud: 0, orchestration: 0, ai: null },
  { year: "2003", infrastructure: 30, virtual: 12, cloud: 2, orchestration: 0, ai: null },
  { year: "2006", infrastructure: 45, virtual: 35, cloud: 8, orchestration: 0, ai: null },
  { year: "2010", infrastructure: 55, virtual: 50, cloud: 25, orchestration: 0, ai: null },
  
  // 2010-2015: Cloud computing adoption accelerates
  { year: "2012", infrastructure: 50, virtual: 55, cloud: 45, orchestration: 5, ai: null },
  { year: "2015", infrastructure: 48, virtual: 58, cloud: 62, orchestration: 25, ai: null },
  
  // 2015-2020: Container orchestration becomes mainstream
  { year: "2017", infrastructure: 45, virtual: 56, cloud: 68, orchestration: 48, ai: null },
  { year: "2020", infrastructure: 42, virtual: 54, cloud: 72, orchestration: 65, ai: null },
  { year: "2021", infrastructure: 41, virtual: 53, cloud: 71, orchestration: 67, ai: null },
  
  // 2022-2025: AI Platform Engineering begins
  { year: "2022", infrastructure: 40, virtual: 52, cloud: 70, orchestration: 68, ai: 3 },
  { year: "2023", infrastructure: 38, virtual: 50, cloud: 68, orchestration: 66, ai: 22 },
  { year: "2024", infrastructure: 37, virtual: 49, cloud: 67, orchestration: 64, ai: 40 },
  { year: "2025", infrastructure: 36, virtual: 48, cloud: 66, orchestration: 63, ai: 52 },
];

const CustomLegend = (props: any) => {
  const { payload, isDark } = props;

  // Recharts reverses the order, so we need to display them in chronological order
  const chronologicalOrder = [
    { key: "infrastructure", label: "Infrastructure Abstractions (2000)", year: "2000", color: "#3b82f6" },
    { key: "virtual", label: "Virtualization (2005)", year: "2005", color: "#8b5cf6" },
    { key: "cloud", label: "Cloud Computing (2010)", year: "2010", color: "#06b6d4" },
    { key: "orchestration", label: "Container Orchestration (2015)", year: "2015", color: "#10b981" },
    { key: "ai", label: "AI Platform Engineering (2022)", year: "2022", color: "#f59e0b" },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-x-7 gap-y-3 mt-6">
      {chronologicalOrder.map((item, index: number) => {
        return (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <span
              className={`font-mono text-xs whitespace-nowrap`}
              style={{
                color: item.color,
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
              dot={{ fill: "#f59e0b", r: 3 }}
              name="AI Platform Engineering"
              strokeOpacity={0.9}
              connectNulls={false}
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


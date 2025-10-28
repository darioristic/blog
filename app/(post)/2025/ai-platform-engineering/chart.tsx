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
  { year: "2013", infrastructure: 100, orchestration: 0, ai: 0 },
  { year: "2015", infrastructure: 100, orchestration: 100, ai: 0 },
  { year: "2018", infrastructure: 100, orchestration: 100, ai: 0 },
  { year: "2020", infrastructure: 100, orchestration: 100, ai: 0 },
  { year: "2022", infrastructure: 100, orchestration: 100, ai: 30 },
  { year: "2023", infrastructure: 100, orchestration: 100, ai: 70 },
  { year: "2024", infrastructure: 100, orchestration: 100, ai: 100 },
];

const CustomLegend = (props: any) => {
  const { payload, isDark } = props;

  return (
    <div className="flex flex-wrap justify-center gap-x-7 gap-y-3 mt-6">
      {payload.map((entry: any, index: number) => {
        const getIcon = (value: string) => {
          switch (value) {
            case "infrastructure":
              return "⚙️";
            case "orchestration":
              return "📦";
            case "ai":
              return "🤖";
            default:
              return "•";
          }
        };

        const getLabel = (value: string) => {
          switch (value) {
            case "infrastructure":
              return "Infrastructure Abstractions";
            case "orchestration":
              return "Container Orchestration";
            case "ai":
              return "AI Platform Engineering";
            default:
              return value;
          }
        };

        return (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <span>{getIcon(entry.value)}</span>
            <span
              className={`font-mono text-xs whitespace-nowrap`}
              style={{
                color: entry.color || undefined,
              }}
            >
              {getLabel(entry.value)}
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
              { value: "infrastructure", color: "#3b82f6" },
              { value: "orchestration", color: "#10b981" },
              { value: "ai", color: "#f59e0b" },
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
        Platform Engineering evolution: From infrastructure to orchestration to AI abstractions
      </p>
    </div>
  );
}


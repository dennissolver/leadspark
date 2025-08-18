// packages/ui/AnalyticsChart.tsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

type AnalyticsChartProps = {
  data: { name: string; value: number }[];
  title?: string;
};

export const AnalyticsChart = ({ data, title = "Analytics Overview" }: AnalyticsChartProps) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      <LineChart width={600} height={300} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#4b5563" />
        <YAxis stroke="#4b5563" />
        <Tooltip
          contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #d1d5db" }}
          itemStyle={{ color: "#1f2937" }}
        />
        <Legend wrapperStyle={{ color: "#1f2937" }} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#8884d8" // Purple for distinction
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </div>
  );
};
// packages/ui/components/Chart.tsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

type ChartProps = {
  data: { name: string; value: number }[];
};

export const Chart = ({ data }: ChartProps) => {
  return (
    <LineChart width={600} height={300} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
      <XAxis dataKey="name" stroke="#888" />
      <YAxis stroke="#888" />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
    </LineChart>
  );
};
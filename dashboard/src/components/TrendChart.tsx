import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendChartProps {
  data: Array<{ date: string; value: number }>;
  onClick?: () => void;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, onClick }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} onClick={onClick}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TrendChart;
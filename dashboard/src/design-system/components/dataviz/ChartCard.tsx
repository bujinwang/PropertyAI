import React from 'react';
import { Card, CardContent, CardHeader, CardProps } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartCardProps extends CardProps {
  title: string;
  chartData: any;
  chartOptions?: any;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, chartData, chartOptions, ...props }) => {
  return (
    <Card {...props}>
      <CardHeader title={title} />
      <CardContent>
        <Bar data={chartData} options={chartOptions} />
      </CardContent>
    </Card>
  );
};

export default ChartCard;

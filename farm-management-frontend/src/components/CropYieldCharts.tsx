import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CropYield {
  cropName: string;
  expectedYield: number;
  actualYield: number;
  area: number;
}

interface YieldTrend {
  month: string;
  yield: number;
}

export const CropYieldComparison: React.FC<{ data: CropYield[] }> = ({ data }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold mb-4">Crop Yield: Expected vs Actual</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="cropName" />
        <YAxis label={{ value: 'Yield (tons)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="expectedYield" fill="#3b82f6" name="Expected" />
        <Bar dataKey="actualYield" fill="#22c55e" name="Actual" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const YieldTrendChart: React.FC<{ data: YieldTrend[] }> = ({ data }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold mb-4">Yield Trend Over Time</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis label={{ value: 'Yield (tons)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Line type="monotone" dataKey="yield" stroke="#22c55e" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

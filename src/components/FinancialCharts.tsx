import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface CategoryData {
  category: string;
  amount: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const ExpenseBreakdown: React.FC<{ data: CategoryData[] }> = ({ data }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold mb-4">Expense Breakdown by Category</h3>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          dataKey="amount"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `KSh ${value.toLocaleString()}`} />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export const IncomeVsExpenses: React.FC<{ data: MonthlyData[] }> = ({ data }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold mb-4">Income vs Expenses Trend</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value: number) => `KSh ${value.toLocaleString()}`} />
        <Legend />
        <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Income" />
        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
        <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Profit" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const ProfitMarginChart: React.FC<{ data: MonthlyData[] }> = ({ data }) => {
  const profitMarginData = data.map(item => ({
    month: item.month,
    margin: item.income > 0 ? ((item.profit / item.income) * 100).toFixed(1) : 0
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Profit Margin Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={profitMarginData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis label={{ value: 'Margin (%)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value: number) => `${value}%`} />
          <Bar dataKey="margin" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const FinancialSummaryCards: React.FC<{ 
  totalIncome: number; 
  totalExpenses: number; 
  netProfit: number;
  profitMargin: number;
}> = ({ totalIncome, totalExpenses, netProfit, profitMargin }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Total Income</p>
          <p className="text-2xl font-bold text-green-600">KSh {totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-green-100 p-3 rounded-lg">
          <TrendingUp className="h-6 w-6 text-green-600" />
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">KSh {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-red-100 p-3 rounded-lg">
          <TrendingDown className="h-6 w-6 text-red-600" />
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Net Profit</p>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            KSh {netProfit.toLocaleString()}
          </p>
        </div>
        <div className={`${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'} p-3 rounded-lg`}>
          <DollarSign className={`h-6 w-6 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Profit Margin</p>
          <p className="text-2xl font-bold text-blue-600">{profitMargin.toFixed(1)}%</p>
        </div>
        <div className="bg-blue-100 p-3 rounded-lg">
          <TrendingUp className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  </div>
);

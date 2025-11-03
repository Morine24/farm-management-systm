import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Download, Calendar, DollarSign, FileText } from 'lucide-react';

const FinancialReports: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  }, []);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchReport();
      fetchForecast();
      fetchCategories();
    }
  }, [dateRange]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/financial/report?startDate=${dateRange.start}&endDate=${dateRange.end}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async () => {
    try {
      const response = await fetch('/api/financial/forecast?months=6');
      if (response.ok) {
        const data = await response.json();
        setForecast(data);
      }
    } catch (error) {
      console.error('Failed to fetch forecast:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/financial/categories?startDate=${dateRange.start}&endDate=${dateRange.end}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const exportReport = () => {
    if (!reportData) return;
    
    const content = `
FINANCIAL REPORT
Period: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}

SUMMARY
Total Income: $${reportData.totalIncome.toLocaleString()}
Total Expenses: $${reportData.totalExpenses.toLocaleString()}
Net Profit: $${reportData.netProfit.toLocaleString()}
Profit Margin: ${reportData.profitMargin}%

INCOME BY CATEGORY
${Object.entries(reportData.incomeByCategory).map(([cat, amt]: [string, any]) => 
  `${cat}: $${amt.toLocaleString()}`).join('\n')}

EXPENSES BY CATEGORY
${Object.entries(reportData.expensesByCategory).map(([cat, amt]: [string, any]) => 
  `${cat}: $${amt.toLocaleString()}`).join('\n')}
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${dateRange.start}-to-${dateRange.end}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const categoryChartData = (categories || []).slice(0, 6).map((cat, idx) => ({
    name: cat?.category || 'Unknown',
    value: cat?.amount || 0,
    color: COLORS[idx % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports & Forecasts</h1>
        <button
          onClick={exportReport}
          disabled={!reportData}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading report...</p>
        </div>
      ) : reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">${(reportData?.totalIncome || 0).toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">${(reportData?.totalExpenses || 0).toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className={`text-2xl font-bold ${(reportData?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${(reportData?.netProfit || 0).toLocaleString()}
                  </p>
                </div>
                <FileText className={`h-8 w-8 ${(reportData?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Profit Margin</p>
                  <p className="text-2xl font-bold text-blue-600">{reportData?.profitMargin || 0}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Category</h3>
              <div className="space-y-3">
                {Object.entries(reportData?.incomeByCategory || {}).map(([category, amount]: [string, any]) => {
                  const percentage = ((reportData?.totalIncome || 0) > 0 ? ((amount || 0) / reportData.totalIncome * 100) : 0).toFixed(1);
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{category}</span>
                        <span className="font-medium text-gray-900">${(amount || 0).toLocaleString()} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
              <div className="space-y-3">
                {Object.entries(reportData?.expensesByCategory || {}).map(([category, amount]: [string, any]) => {
                  const percentage = ((reportData?.totalExpenses || 0) > 0 ? ((amount || 0) / reportData.totalExpenses * 100) : 0).toFixed(1);
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{category}</span>
                        <span className="font-medium text-gray-900">${(amount || 0).toLocaleString()} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Category Distribution Pie Chart */}
          {categoryChartData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Forecast Section */}
          {forecast && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">6-Month Forecast</h3>
                <div className="text-sm text-gray-600">
                  Growth Rate: <span className="font-medium text-blue-600">{forecast.growthRate}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Avg Monthly Income</p>
                  <p className="text-xl font-bold text-blue-600">${(forecast?.historicalAverage?.income || 0).toLocaleString()}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Avg Monthly Expenses</p>
                  <p className="text-xl font-bold text-red-600">${(forecast?.historicalAverage?.expenses || 0).toLocaleString()}</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecast?.forecast || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="projectedIncome" stroke="#22c55e" strokeWidth={2} name="Projected Income" />
                  <Line type="monotone" dataKey="projectedExpenses" stroke="#ef4444" strokeWidth={2} name="Projected Expenses" />
                  <Line type="monotone" dataKey="projectedProfit" stroke="#3b82f6" strokeWidth={2} name="Projected Profit" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Monthly Projections</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Income</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expenses</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(forecast?.forecast || []).map((month: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-900">{month?.month || 'N/A'}</td>
                          <td className="px-4 py-2 text-sm text-green-600 font-medium">${(month?.projectedIncome || 0).toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-red-600 font-medium">${(month?.projectedExpenses || 0).toLocaleString()}</td>
                          <td className={`px-4 py-2 text-sm font-medium ${(month?.projectedProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${(month?.projectedProfit || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialReports;

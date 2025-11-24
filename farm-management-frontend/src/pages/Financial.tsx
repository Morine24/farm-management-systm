import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Plus, Download, Calendar, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useUser } from '../contexts/UserContext';

interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: Date;
  fieldId?: string;
  fieldName?: string;
}

interface Field {
  id: string;
  name: string;
}

const Financial: React.FC = () => {
  const { isManager, isAdmin, isSuperAdmin } = useUser();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [farms, setFarms] = useState<Field[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'reports'>('transactions');
  const [dateRange, setDateRange] = useState('month');
  const [recordType, setRecordType] = useState<'income' | 'expense'>('expense');
  const [reportData, setReportData] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [reportDateRange, setReportDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');

  const incomeCategories = ['Crop Sales', 'Livestock/Livestock Products Sale', 'Government Subsidy', 'Equipment Rental', 'Other Income'];
  const expenseCategories = ['Seeds & Plants', 'Fertilizers', 'Pesticides', 'Equipment', 'Labor', 'Utilities', 'Maintenance', 'Transportation', 'Other Expenses'];
  
  // Spending limits for managers (KSh)
  const MANAGER_SPENDING_LIMIT = 50000;
  const getSpendingLimit = () => {
    if (isSuperAdmin || isAdmin) return Infinity;
    if (isManager) return MANAGER_SPENDING_LIMIT;
    return 0;
  };

  useEffect(() => {
    fetchFinancialRecords();
    fetchFarms();
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    setReportDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'reports' && reportDateRange.start && reportDateRange.end) {
      fetchReport();
      fetchForecast();
      fetchCategories();
    }
  }, [activeTab, reportDateRange]);

  const fetchFinancialRecords = async () => {
    try {
      const response = await fetch('/api/financial');
      if (response.ok) {
        const data = await response.json();
        setRecords(Array.isArray(data) ? data : []);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Failed to fetch financial records:', error);
      setRecords([]);
    }
  };

  const fetchFarms = async () => {
    try {
      const response = await fetch('/api/farms');
      if (response.ok) {
        const data = await response.json();
        setFarms(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch farms:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/financial/report?startDate=${reportDateRange.start}&endDate=${reportDateRange.end}`);
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
      const response = await fetch(`/api/financial/categories?startDate=${reportDateRange.start}&endDate=${reportDateRange.end}`);
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
Period: ${new Date(reportDateRange.start).toLocaleDateString()} - ${new Date(reportDateRange.end).toLocaleDateString()}

SUMMARY
Total Income: KSh ${reportData.totalIncome.toLocaleString()}
Total Expenses: KSh ${reportData.totalExpenses.toLocaleString()}
Net Profit: KSh ${reportData.netProfit.toLocaleString()}
Profit Margin: ${reportData.profitMargin}%

INCOME BY CATEGORY
${Object.entries(reportData.incomeByCategory).map(([cat, amt]: [string, any]) => 
  `${cat}: KSh ${amt.toLocaleString()}`).join('\n')}

EXPENSES BY CATEGORY
${Object.entries(reportData.expensesByCategory).map(([cat, amt]: [string, any]) => 
  `${cat}: KSh ${amt.toLocaleString()}`).join('\n')}
    `.trim();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${reportDateRange.start}-to-${reportDateRange.end}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Item', 'Quantity', 'Unit Price', 'Total Amount', 'Payment Status', 'Field', 'Description'];
    const csvData = records.map(record => {
      let dateStr = 'N/A';
      if (record.date) {
        const date = record.date instanceof Date ? record.date : 
                     (record.date as any).toDate ? (record.date as any).toDate() : 
                     new Date(record.date);
        dateStr = date.toLocaleDateString();
      }
      return [
        dateStr,
        record.type,
        record.category,
        (record as any).item || '',
        (record as any).quantity || '',
        (record as any).unitPrice || '',
        record.amount,
        (record as any).paymentStatus || '',
        record.fieldName || 'General',
        record.description || ''
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const labourCosts = records.filter(r => r.type === 'expense' && r.category === 'Labour Cost').reduce((sum, r) => sum + r.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const monthlyData = [
    { month: 'Jan', income: 45000, expenses: 32000 },
    { month: 'Feb', income: 52000, expenses: 35000 },
    { month: 'Mar', income: 48000, expenses: 38000 },
    { month: 'Apr', income: 61000, expenses: 42000 },
    { month: 'May', income: 55000, expenses: 40000 },
    { month: 'Jun', income: 67000, expenses: 45000 },
  ];

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const categoryChartData = (categories || []).slice(0, 6).map((cat, idx) => ({
    name: cat?.category || 'Unknown',
    value: cat?.amount || 0,
    color: COLORS[idx % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      <Toaster />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Finance Management</h1>
        <div className="flex space-x-3">
          {activeTab === 'transactions' ? (
            <>
              <button 
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </button>
            </>
          ) : (
            <button
              onClick={exportReport}
              disabled={!reportData}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports & Forecasts
          </button>
        </nav>
      </div>

      {activeTab === 'transactions' ? (
        <>
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-3xl font-bold text-green-600">KSh {totalIncome.toLocaleString()}</p>
              <p className="text-sm text-green-500 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12% from last month
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-3xl font-bold text-red-600">KSh {totalExpenses.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                Labour: KSh {labourCosts.toLocaleString()} ({totalExpenses > 0 ? ((labourCosts/totalExpenses)*100).toFixed(1) : 0}%)
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                KSh {netProfit.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <DollarSign className="h-4 w-4 mr-1" />
                {((netProfit / totalIncome) * 100).toFixed(1)}% margin
              </p>
            </div>
            <div className={`${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'} p-3 rounded-lg`}>
              <DollarSign className={`h-6 w-6 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Income vs Expenses</h3>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="month">Last 6 Months</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`KSh ${value.toLocaleString()}`, '']} />
              <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
        </>
      ) : (
        <>
          {/* Reports Tab Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4 mb-6">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={reportDateRange.start}
                    onChange={(e) => setReportDateRange({ ...reportDateRange, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={reportDateRange.end}
                    onChange={(e) => setReportDateRange({ ...reportDateRange, end: e.target.value })}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">KSh {(reportData?.totalIncome || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">KSh {(reportData?.totalExpenses || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className={`text-2xl font-bold ${(reportData?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    KSh {(reportData?.netProfit || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600">Profit Margin</p>
                  <p className="text-2xl font-bold text-blue-600">{reportData?.profitMargin || 0}%</p>
                </div>
              </div>

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
                            <span className="font-medium text-gray-900">KSh {(amount || 0).toLocaleString()} ({percentage}%)</span>
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
                            <span className="font-medium text-gray-900">KSh {(amount || 0).toLocaleString()} ({percentage}%)</span>
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

              {forecast && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">6-Month Forecast</h3>
                    <div className="text-sm text-gray-600">
                      Growth Rate: <span className="font-medium text-blue-600">{forecast.growthRate}</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={forecast?.forecast || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `KSh ${value.toLocaleString()}`} />
                      <Line type="monotone" dataKey="projectedIncome" stroke="#22c55e" strokeWidth={2} name="Income" />
                      <Line type="monotone" dataKey="projectedExpenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                      <Line type="monotone" dataKey="projectedProfit" stroke="#3b82f6" strokeWidth={2} name="Profit" strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 'transactions' && (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.slice(0, 10).map((record) => {
                const date = record.date instanceof Date ? record.date : 
                             (record.date as any).toDate ? (record.date as any).toDate() : 
                             new Date(record.date);
                return (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {date.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      record.type === 'income' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.fieldName || 'General'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {record.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={record.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {record.type === 'income' ? '+' : '-'}KSh {record.amount.toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add Financial Record</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const farmId = formData.get('farmId') as string;
              const selectedFarm = farms.find(f => f.id === farmId);
              const recordData: any = {
                type: recordType,
                category: formData.get('category') as string,
                amount: parseFloat(formData.get('amount') as string),
                description: formData.get('description') as string,
                date: new Date(formData.get('date') as string)
              };
              
              if (farmId) {
                recordData.fieldId = farmId;
                recordData.fieldName = selectedFarm?.name;
              }
              
              if (recordType === 'income') {
                recordData.item = formData.get('item') as string;
                recordData.quantity = parseFloat(formData.get('quantity') as string) || 0;
                recordData.unitPrice = parseFloat(formData.get('unitPrice') as string) || 0;
                recordData.paymentStatus = formData.get('paymentStatus') as string;
              }
              
              // Check spending limits for managers
              if (recordType === 'expense' && isManager && recordData.amount > MANAGER_SPENDING_LIMIT) {
                toast.error(`Managers cannot approve expenses over KSh ${MANAGER_SPENDING_LIMIT.toLocaleString()}. Please contact an admin.`);
                return;
              }
              
              try {
                // Remove undefined fields
                Object.keys(recordData).forEach(key => {
                  if (recordData[key] === undefined) {
                    delete recordData[key];
                  }
                });
                
                // Use Firebase directly instead of API
                const { addDoc, collection } = await import('firebase/firestore');
                const { db } = await import('../config/firebase');
                
                await addDoc(collection(db, 'financial'), recordData);
                
                setShowAddModal(false);
                setRecordType('expense');
                setQuantity(0);
                setUnitPrice(0);
                setSelectedCategory('');
                fetchFinancialRecords();
                toast.success('Financial record added successfully!');
              } catch (error) {
                console.error('Error adding record:', error);
                toast.error('Failed to add record. Please try again.');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRecordType('income')}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                        recordType === 'income'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      💰 Income
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecordType('expense')}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                        recordType === 'expense'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      💸 Expense
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    required
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select category</option>
                    {(recordType === 'income' ? incomeCategories : expenseCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                {recordType === 'income' && (selectedCategory === 'Crop Sales' || selectedCategory === 'Livestock/Livestock Products Sale') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Item/Commodity</label>
                      <input
                        type="text"
                        name="item"
                        placeholder="e.g., Manangu, Kales"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          name="quantity"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          value={quantity || ''}
                          onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (KSh)</label>
                        <input
                          type="number"
                          name="unitPrice"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={unitPrice || ''}
                          onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Amount (KSh)
                      {isManager && recordType === 'expense' && (
                        <span className="text-xs text-orange-600 block">Manager limit: KSh {MANAGER_SPENDING_LIMIT.toLocaleString()}</span>
                      )}
                    </label>
                    <input
                      type="number"
                      name="amount"
                      required
                      step="0.01"
                      min="0.01"
                      max={isManager && recordType === 'expense' ? MANAGER_SPENDING_LIMIT : undefined}
                      placeholder="0.00"
                      value={recordType === 'income' && quantity && unitPrice ? (quantity * unitPrice).toFixed(2) : ''}
                      readOnly={recordType === 'income' && quantity > 0 && unitPrice > 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      required
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                {recordType === 'income' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                    <select
                      name="paymentStatus"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="Yes">Yes - Paid</option>
                      <option value="No">No - Pending</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
                  <select
                    name="farmId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">General (Not farm-specific)</option>
                    {farms.map(farm => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Add notes about this transaction..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financial;
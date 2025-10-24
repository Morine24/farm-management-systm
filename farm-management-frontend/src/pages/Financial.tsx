import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Plus, Download, Calendar } from 'lucide-react';

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
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [recordType, setRecordType] = useState<'income' | 'expense'>('expense');

  const incomeCategories = ['Crop Sales', 'Livestock Sales', 'Government Subsidy', 'Equipment Rental', 'Other Income'];
  const expenseCategories = ['Seeds & Plants', 'Fertilizers', 'Pesticides', 'Equipment', 'Labor', 'Utilities', 'Maintenance', 'Transportation', 'Other Expenses'];

  useEffect(() => {
    fetchFinancialRecords();
    fetchFields();
  }, []);

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

  const fetchFields = async () => {
    try {
      const response = await fetch('/api/fields');
      if (response.ok) {
        const data = await response.json();
        setFields(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch fields:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Field', 'Description', 'Amount'];
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
        record.fieldName || 'General',
        record.description || '',
        record.amount
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
  const netProfit = totalIncome - totalExpenses;

  const monthlyData = [
    { month: 'Jan', income: 45000, expenses: 32000 },
    { month: 'Feb', income: 52000, expenses: 35000 },
    { month: 'Mar', income: 48000, expenses: 38000 },
    { month: 'Apr', income: 61000, expenses: 42000 },
    { month: 'May', income: 55000, expenses: 40000 },
    { month: 'Jun', income: 67000, expenses: 45000 },
  ];

  const expenseCategoryData = [
    { category: 'Seeds & Plants', amount: 15000, color: '#22c55e' },
    { category: 'Fertilizers', amount: 12000, color: '#3b82f6' },
    { category: 'Equipment', amount: 8000, color: '#f59e0b' },
    { category: 'Labor', amount: 18000, color: '#ef4444' },
    { category: 'Utilities', amount: 5000, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
        <div className="flex space-x-3">
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
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-3xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
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
              <p className="text-3xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
              <p className="text-sm text-red-500 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +5% from last month
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
                ${netProfit.toLocaleString()}
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
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
              <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenseCategoryData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="category" type="category" width={100} />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
              <Bar dataKey="amount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
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
                      {record.type === 'income' ? '+' : '-'}${record.amount.toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add Financial Record</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const fieldId = formData.get('fieldId') as string;
              const selectedField = fields.find(f => f.id === fieldId);
              const recordData = {
                type: recordType,
                category: formData.get('category') as string,
                amount: parseFloat(formData.get('amount') as string),
                description: formData.get('description') as string,
                date: new Date(formData.get('date') as string),
                fieldId: fieldId || undefined,
                fieldName: selectedField?.name || undefined
              };
              
              try {
                const response = await fetch('/api/financial', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(recordData)
                });
                
                if (response.ok) {
                  setShowAddModal(false);
                  setRecordType('expense');
                  fetchFinancialRecords();
                } else {
                  console.error('Failed to add record');
                }
              } catch (error) {
                console.error('Error adding record:', error);
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select category</option>
                    {(recordType === 'income' ? incomeCategories : expenseCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                    <input
                      type="number"
                      name="amount"
                      required
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
                  <select
                    name="fieldId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">General (Not field-specific)</option>
                    {fields.map(field => (
                      <option key={field.id} value={field.id}>{field.name}</option>
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
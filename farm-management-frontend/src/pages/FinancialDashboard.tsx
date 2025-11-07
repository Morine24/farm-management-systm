import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DollarSign, TrendingUp, TrendingDown, Users, Package, Briefcase, Calendar, ArrowRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
}

interface Task {
  id: string;
  labourCost?: number;
  actualCost?: number;
  status: string;
}

interface InventoryItem {
  id: string;
  totalValue: number;
}

const FinancialDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    const unsubFinancial = onSnapshot(collection(db, 'financial'), (snapshot) => {
      const recordsData = snapshot.docs.map(doc => {
        const data = doc.data();
        let date = new Date();
        if (data.date) {
          date = data.date instanceof Date ? data.date : 
                 data.date.toDate ? data.date.toDate() : 
                 new Date(data.date);
        }
        return {
          id: doc.id,
          ...data,
          date
        };
      }) as FinancialRecord[];
      setRecords(recordsData);
    });

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);
    });

    const unsubInventory = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({
        id: doc.id,
        totalValue: (doc.data().quantity || 0) * (doc.data().unitPrice || 0)
      })) as InventoryItem[];
      setInventory(inventoryData);
    });

    return () => {
      unsubFinancial();
      unsubTasks();
      unsubInventory();
    };
  }, []);

  const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const totalLabourCost = tasks.reduce((sum, t) => sum + (t.actualCost || t.labourCost || 0), 0);
  const totalInventoryValue = inventory.reduce((sum, i) => sum + i.totalValue, 0);
  const netProfit = totalIncome - totalExpenses - totalLabourCost;

  const recentRecords = records
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  const expensesByCategory = records
    .filter(r => r.type === 'expense')
    .reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + r.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
  categoryData.push({ name: 'Labour', value: totalLabourCost });

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const monthlyData = records.reduce((acc, r) => {
    const month = r.date.toLocaleDateString('en-US', { month: 'short' });
    if (!acc[month]) acc[month] = { month, income: 0, expenses: 0 };
    if (r.type === 'income') acc[month].income += r.amount;
    else acc[month].expenses += r.amount;
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(monthlyData);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">Monitor farm financial performance</p>
        </div>
        <button
          onClick={() => navigate('/financial')}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <FileText className="h-4 w-4 mr-2" />
          Manage Transactions
        </button>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2 mb-4">
        {['week', 'month', 'quarter', 'year'].map(period => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg capitalize ${
              selectedPeriod === period
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-xl shadow-green-400 p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl shadow-green-400 p-6">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl shadow-green-400 p-6">
          <div className="flex items-center">
            <DollarSign className={`h-8 w-8 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${netProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl shadow-blue-400 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Labour Costs</p>
              <p className="text-2xl font-bold text-blue-600">${totalLabourCost.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl shadow-purple-400 p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-purple-600">${totalInventoryValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl shadow-orange-400 p-6">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-orange-600">${(totalExpenses + totalLabourCost).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl shadow-indigo-400 p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className="text-2xl font-bold text-indigo-600">
                {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Labour Cost Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Labour Cost Tracking</h2>
          <button
            onClick={() => navigate('/tasks')}
            className="text-primary-600 hover:text-primary-700 flex items-center text-sm font-medium"
          >
            Manage Tasks <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Tasks</p>
            <p className="text-2xl font-bold text-blue-600">{tasks.length}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Completed Tasks</p>
            <p className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'completed').length}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Avg Cost/Task</p>
            <p className="text-2xl font-bold text-purple-600">
              ${tasks.length > 0 ? (totalLabourCost / tasks.length).toFixed(2) : 0}
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600">Pending Tasks</p>
            <p className="text-2xl font-bold text-orange-600">
              {tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length}
            </p>
          </div>
        </div>
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Labour Costs</h3>
          <div className="space-y-2">
            {tasks.filter(t => t.actualCost || t.labourCost).slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900">{task.type || 'Task'}</p>
                  <p className="text-xs text-gray-500">{task.assignedTo || 'Unassigned'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">${(task.actualCost || task.labourCost || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{task.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <button
            onClick={() => navigate('/financial')}
            className="text-primary-600 hover:text-primary-700 flex items-center text-sm font-medium"
          >
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.date.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{record.description}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    record.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {record.type === 'income' ? '+' : '-'}${record.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;

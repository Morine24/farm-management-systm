import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, MapPin, Wheat, CheckSquare, Package, AlertTriangle } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface DashboardStats {
  totalFields: number;
  activeCrops: number;
  pendingTasks: number;
  lowStockItems: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
}

interface FieldFinancial {
  fieldName: string;
  income: number;
  expenses: number;
  profit: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalFields: 0,
    activeCrops: 0,
    pendingTasks: 0,
    lowStockItems: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0
  });
  const [fieldFinancials, setFieldFinancials] = useState<FieldFinancial[]>([]);

  useEffect(() => {
    fetchDashboardStats();
    
    // Real-time listeners for Firebase collections
    const unsubscribeFields = onSnapshot(collection(db, 'fields'), () => {
      fetchDashboardStats();
    });
    
    const unsubscribeCrops = onSnapshot(collection(db, 'crops'), () => {
      fetchDashboardStats();
    });
    
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), () => {
      fetchDashboardStats();
    });
    
    const unsubscribeInventory = onSnapshot(collection(db, 'inventory'), () => {
      fetchDashboardStats();
    });
    
    return () => {
      unsubscribeFields();
      unsubscribeCrops();
      unsubscribeTasks();
      unsubscribeInventory();
    };
  }, []);

  const fetchDashboardStats = async () => {
    setStats({
      totalFields: 4,
      activeCrops: 3,
      pendingTasks: 2,
      lowStockItems: 0,
      monthlyRevenue: 65000,
      monthlyExpenses: 42000
    });
    
    setFieldFinancials([
      { fieldName: 'North Field', income: 25000, expenses: 15000, profit: 10000 },
      { fieldName: 'South Field', income: 20000, expenses: 12000, profit: 8000 },
      { fieldName: 'East Field', income: 15000, expenses: 10000, profit: 5000 },
      { fieldName: 'West Field', income: 5000, expenses: 5000, profit: 0 }
    ]);
  };

  const statCards = [
    {
      title: 'Total Fields',
      value: stats.totalFields,
      icon: MapPin,
      color: 'bg-blue-500',
      change: '+2 this month'
    },
    {
      title: 'Active Crops',
      value: stats.activeCrops,
      icon: Wheat,
      color: 'bg-green-500',
      change: '+5 this season'
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: CheckSquare,
      color: 'bg-yellow-500',
      change: '3 overdue'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: Package,
      color: 'bg-red-500',
      change: 'Need attention'
    }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 45000, expenses: 32000 },
    { month: 'Feb', revenue: 52000, expenses: 35000 },
    { month: 'Mar', revenue: 48000, expenses: 38000 },
    { month: 'Apr', revenue: 61000, expenses: 42000 },
    { month: 'May', revenue: 55000, expenses: 40000 },
    { month: 'Jun', revenue: 67000, expenses: 45000 },
  ];

  const cropDistribution = [
    { name: 'Corn', value: 35, color: '#22c55e' },
    { name: 'Wheat', value: 25, color: '#eab308' },
    { name: 'Soybeans', value: 20, color: '#3b82f6' },
    { name: 'Rice', value: 20, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-xl shadow-green-400 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{card.change}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Revenue vs Expenses</h3>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600">+12% this month</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Crop Distribution */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Crop Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cropDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {cropDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 md:p-4 bg-green-50 rounded-lg">
            <p className="text-xl md:text-2xl font-bold text-green-600">${stats.monthlyRevenue.toLocaleString()}</p>
            <p className="text-xs md:text-sm text-gray-600">Total Income</p>
          </div>
          <div className="text-center p-3 md:p-4 bg-red-50 rounded-lg">
            <p className="text-xl md:text-2xl font-bold text-red-600">${stats.monthlyExpenses.toLocaleString()}</p>
            <p className="text-xs md:text-sm text-gray-600">Total Expenses</p>
          </div>
          <div className="text-center p-3 md:p-4 bg-blue-50 rounded-lg">
            <p className="text-xl md:text-2xl font-bold text-blue-600">${(stats.monthlyRevenue - stats.monthlyExpenses).toLocaleString()}</p>
            <p className="text-xs md:text-sm text-gray-600">Net Profit</p>
          </div>
        </div>
      </div>

      {/* Recent Activity & Field Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">New Field Added</p>
                <p className="text-sm text-gray-600">{stats.totalFields} total fields</p>
                <p className="text-xs text-gray-500">Just now</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Wheat className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Crop Status Updated</p>
                <p className="text-sm text-gray-600">{stats.activeCrops} active crops</p>
                <p className="text-xs text-gray-500">Live updates</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <CheckSquare className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Tasks Pending</p>
                <p className="text-sm text-gray-600">{stats.pendingTasks} tasks need attention</p>
                <p className="text-xs text-gray-500">Updated now</p>
              </div>
            </div>
          </div>
        </div>

        {/* Field Performance */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Field Performance</h3>
          {fieldFinancials.length > 0 ? (
            <div className="space-y-3">
              {fieldFinancials.slice(0, 5).map((field, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-medium text-gray-900">{field.fieldName}</p>
                    <span className={`text-sm font-semibold ${
                      field.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${field.profit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Income: ${field.income.toLocaleString()}</span>
                    <span>Expenses: ${field.expenses.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No financial data yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, MapPin, Wheat, CheckSquare, Package, AlertTriangle, DollarSign } from 'lucide-react';
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
  const [financialRecords, setFinancialRecords] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

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
    
    const unsubscribeFinancial = onSnapshot(collection(db, 'financial'), (snapshot) => {
      setFinancialRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    const unsubscribeFarms = onSnapshot(collection(db, 'farms'), (snapshot) => {
      setFarms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    const unsubscribeCropsData = onSnapshot(collection(db, 'crops'), (snapshot) => {
      setCrops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    const unsubscribeTasksData = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return () => {
      unsubscribeFields();
      unsubscribeCrops();
      unsubscribeTasks();
      unsubscribeInventory();
      unsubscribeFinancial();
      unsubscribeFarms();
      unsubscribeCropsData();
      unsubscribeTasksData();
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
  };

  // Calculate financial KPIs
  const totalIncome = financialRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  
  const totalExpenses = financialRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;
  
  // Calculate sales (crop sales only)
  const totalSales = financialRecords
    .filter(r => r.type === 'income' && (r.category === 'Crop Sales' || r.category === 'Livestock/Livestock Products Sale'))
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  
  const statCards = [
    {
      title: 'Total Income',
      value: `KSh ${totalIncome.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-green-500',
      change: `${profitMargin}% margin`
    },
    {
      title: 'Total Expenses',
      value: `KSh ${totalExpenses.toLocaleString()}`,
      icon: TrendingDown,
      color: 'bg-red-500',
      change: 'This period'
    },
    {
      title: 'Net Profit',
      value: `KSh ${netProfit.toLocaleString()}`,
      icon: DollarSign,
      color: netProfit >= 0 ? 'bg-blue-500' : 'bg-red-500',
      change: netProfit >= 0 ? 'Profitable' : 'Loss'
    },
    {
      title: 'Total Sales',
      value: `KSh ${totalSales.toLocaleString()}`,
      icon: Wheat,
      color: 'bg-purple-500',
      change: 'Crop & Livestock'
    },
    {
      title: 'Active Crops',
      value: stats.activeCrops,
      icon: Wheat,
      color: 'bg-green-500',
      change: 'Growing'
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: CheckSquare,
      color: 'bg-yellow-500',
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
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.change}</p>
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

      {/* Recent Activity & Field Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Total Farms</p>
                <p className="text-sm text-gray-600">{farms.length} farms registered</p>
                <p className="text-xs text-gray-500">Real-time</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Wheat className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Active Crops</p>
                <p className="text-sm text-gray-600">{crops.filter(c => c.status === 'growing' || c.status === 'active').length} crops growing</p>
                <p className="text-xs text-gray-500">Live updates</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <CheckSquare className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Pending Tasks</p>
                <p className="text-sm text-gray-600">{tasks.filter(t => t.status !== 'completed').length} tasks need attention</p>
                <p className="text-xs text-gray-500">Updated now</p>
              </div>
            </div>
          </div>
        </div>

        {/* Farm Performance */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Farm Performance</h3>
          {farms.length > 0 ? (
            <div className="space-y-3">
              {farms.slice(0, 5).map((farm) => {
                const farmIncome = financialRecords
                  .filter(r => r.type === 'income' && r.fieldId === farm.id)
                  .reduce((sum, r) => sum + (r.amount || 0), 0);
                
                const farmExpenses = financialRecords
                  .filter(r => r.type === 'expense' && r.fieldId === farm.id)
                  .reduce((sum, r) => sum + (r.amount || 0), 0);
                
                const farmProfit = farmIncome - farmExpenses;
                
                return (
                  <div key={farm.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium text-gray-900">{farm.name}</p>
                      <span className={`text-sm font-semibold ${
                        farmProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        KSh {farmProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Income: KSh {farmIncome.toLocaleString()}</span>
                      <span>Expenses: KSh {farmExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No farms yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CropYieldComparison, YieldTrendChart } from '../components/CropYieldCharts';
import { FieldStatusMap } from '../components/FieldStatusMap';
import { ExpenseBreakdown, IncomeVsExpenses, ProfitMarginChart, FinancialSummaryCards } from '../components/FinancialCharts';
import { BarChart3, TrendingUp, Map, DollarSign } from 'lucide-react';

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'financial' | 'crops' | 'fields'>('financial');
  const [farms, setFarms] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [financialRecords, setFinancialRecords] = useState<any[]>([]);

  useEffect(() => {
    const unsubFarms = onSnapshot(collection(db, 'farms'), (snapshot) => {
      setFarms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCrops = onSnapshot(collection(db, 'crops'), (snapshot) => {
      setCrops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubFinancial = onSnapshot(collection(db, 'financial'), (snapshot) => {
      setFinancialRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubFarms();
      unsubCrops();
      unsubFinancial();
    };
  }, []);

  // Financial Data
  const totalIncome = financialRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const totalExpenses = financialRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const expenseByCategory = financialRecords
    .filter(r => r.type === 'expense')
    .reduce((acc: any, r) => {
      const cat = r.category || 'Other';
      acc[cat] = (acc[cat] || 0) + (r.amount || 0);
      return acc;
    }, {});

  const expenseData = Object.entries(expenseByCategory).map(([category, amount]) => ({
    category,
    amount: amount as number
  }));

  const monthlyFinancialData = [
    { month: 'Jan', income: 45000, expenses: 32000, profit: 13000 },
    { month: 'Feb', income: 52000, expenses: 35000, profit: 17000 },
    { month: 'Mar', income: 48000, expenses: 38000, profit: 10000 },
    { month: 'Apr', income: 61000, expenses: 42000, profit: 19000 },
    { month: 'May', income: 55000, expenses: 40000, profit: 15000 },
    { month: 'Jun', income: 67000, expenses: 45000, profit: 22000 },
  ];

  // Crop Yield Data
  const cropYieldData = crops.map(crop => ({
    cropName: crop.name || crop.cropType || 'Unknown',
    expectedYield: crop.expectedYield || 0,
    actualYield: crop.actualYield || crop.expectedYield * 0.85 || 0,
    area: crop.area || 0
  }));

  const yieldTrendData = [
    { month: 'Jan', yield: 12 },
    { month: 'Feb', yield: 15 },
    { month: 'Mar', yield: 18 },
    { month: 'Apr', yield: 22 },
    { month: 'May', yield: 25 },
    { month: 'Jun', yield: 28 },
  ];

  // Field Status Data
  const fieldStatusData = farms.map(farm => ({
    id: farm.id,
    name: farm.name,
    status: farm.status || 'active',
    soilHealth: farm.soilHealth || { ph: 6.5, moisture: 45, temperature: 22 },
    cropType: farm.cropType,
    area: farm.area || 0
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('financial')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'financial'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            Financial Analytics
          </button>
          <button
            onClick={() => setActiveTab('crops')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'crops'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Crop Yields
          </button>
          <button
            onClick={() => setActiveTab('fields')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'fields'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Map className="h-4 w-4" />
            Field Status
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <FinancialSummaryCards
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            netProfit={netProfit}
            profitMargin={profitMargin}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IncomeVsExpenses data={monthlyFinancialData} />
            <ExpenseBreakdown data={expenseData.length > 0 ? expenseData : [
              { category: 'Seeds', amount: 15000 },
              { category: 'Fertilizers', amount: 12000 },
              { category: 'Labor', amount: 25000 },
              { category: 'Equipment', amount: 8000 }
            ]} />
          </div>
          <ProfitMarginChart data={monthlyFinancialData} />
        </div>
      )}

      {activeTab === 'crops' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Total Crops</p>
              <p className="text-3xl font-bold text-green-600">{crops.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Active Crops</p>
              <p className="text-3xl font-bold text-blue-600">
                {crops.filter(c => c.status === 'active' || c.status === 'growing').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Total Area</p>
              <p className="text-3xl font-bold text-orange-600">
                {crops.reduce((sum, c) => sum + (c.area || 0), 0).toFixed(1)} acres
              </p>
            </div>
          </div>
          <CropYieldComparison data={cropYieldData.length > 0 ? cropYieldData : [
            { cropName: 'Corn', expectedYield: 25, actualYield: 22, area: 10 },
            { cropName: 'Wheat', expectedYield: 20, actualYield: 18, area: 8 },
            { cropName: 'Soybeans', expectedYield: 15, actualYield: 16, area: 6 }
          ]} />
          <YieldTrendChart data={yieldTrendData} />
        </div>
      )}

      {activeTab === 'fields' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Total Fields</p>
              <p className="text-3xl font-bold text-green-600">{farms.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Active Fields</p>
              <p className="text-3xl font-bold text-blue-600">
                {farms.filter(f => f.status === 'active' || !f.status).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Total Area</p>
              <p className="text-3xl font-bold text-orange-600">
                {farms.reduce((sum, f) => sum + (f.area || 0), 0).toFixed(1)} acres
              </p>
            </div>
          </div>
          <FieldStatusMap fields={fieldStatusData.length > 0 ? fieldStatusData : [
            { id: '1', name: 'North Field', status: 'active', soilHealth: { ph: 6.8, moisture: 45, temperature: 22 }, cropType: 'Corn', area: 10 },
            { id: '2', name: 'South Field', status: 'active', soilHealth: { ph: 6.5, moisture: 50, temperature: 23 }, cropType: 'Wheat', area: 8 },
            { id: '3', name: 'East Field', status: 'maintenance', soilHealth: { ph: 7.0, moisture: 40, temperature: 21 }, area: 6 }
          ]} />
        </div>
      )}
    </div>
  );
};

export default Analytics;

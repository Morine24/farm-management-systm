import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';

interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
}

const FinancialDashboard: React.FC = () => {
  const [records, setRecords] = useState<FinancialRecord[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'financial'), (snapshot) => {
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

    return () => unsubscribe();
  }, []);

  const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const recentRecords = records
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">Monitor farm financial performance</p>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        <div className="bg-white rounded-lg shadow-xl shadow-green-400 p-6">
          <div className="flex items-center">
            <PieChart className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{records.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
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
  );
};

export default FinancialDashboard;
import React, { useState, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast, { Toaster } from 'react-hot-toast';

interface LivestockRecord {
  id: string;
  date: Date;
  animalType: string;
  openingCount: number;
  birthsAdded: number;
  deathsLoss: number;
  salesRemoved: number;
  closingBalance: number;
  remarks: string;
}

const LivestockInventory: React.FC = () => {
  const [records, setRecords] = useState<LivestockRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const animalTypes = ['Goats', 'Cows', 'Chicks', 'Geese', 'Guinea fowls', 'Sheep', 'Pigs', 'Ducks', 'Turkeys'];

  useEffect(() => {
    fetchRecords();
  }, [selectedDate]);

  const fetchRecords = async () => {
    const dateObj = new Date(selectedDate);
    const snapshot = await getDocs(
      query(collection(db, 'livestockInventory'), where('date', '==', Timestamp.fromDate(dateObj)))
    );
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    })) as LivestockRecord[];
    setRecords(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const openingCount = parseFloat(formData.get('openingCount') as string) || 0;
    const birthsAdded = parseFloat(formData.get('birthsAdded') as string) || 0;
    const deathsLoss = parseFloat(formData.get('deathsLoss') as string) || 0;
    const salesRemoved = parseFloat(formData.get('salesRemoved') as string) || 0;
    
    const recordData = {
      date: Timestamp.fromDate(new Date(formData.get('date') as string)),
      animalType: formData.get('animalType') as string,
      openingCount,
      birthsAdded,
      deathsLoss,
      salesRemoved,
      closingBalance: openingCount + birthsAdded - deathsLoss - salesRemoved,
      remarks: formData.get('remarks') as string
    };

    try {
      await addDoc(collection(db, 'livestockInventory'), recordData);
      setShowModal(false);
      fetchRecords();
      toast.success('Record added successfully!');
    } catch (error) {
      toast.error('Failed to add record');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Animal Type', 'Opening Count', 'Births/Added', 'Deaths/Loss', 'Sales/Removed', 'Closing Balance', 'Remarks'];
    const csvData = records.map(r => [
      r.date.toLocaleDateString(),
      r.animalType,
      r.openingCount,
      r.birthsAdded,
      r.deathsLoss,
      r.salesRemoved,
      r.closingBalance,
      r.remarks
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `livestock-inventory-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Toaster />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Livestock Inventory Tracking</h1>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium mb-2">Select Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Animal Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opening Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Births/Added</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deaths/Loss</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales/Removed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Closing Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map(record => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{record.animalType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.openingCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.birthsAdded}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.deathsLoss}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.salesRemoved}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{record.closingBalance}</td>
                <td className="px-6 py-4 text-sm">{record.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add Livestock Record</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" name="date" required defaultValue={selectedDate} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Animal Type</label>
                  <select name="animalType" required className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Select type</option>
                    {animalTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Opening Count</label>
                  <input type="number" name="openingCount" min="0" defaultValue="0" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Births/Added</label>
                  <input type="number" name="birthsAdded" min="0" defaultValue="0" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Deaths/Loss</label>
                  <input type="number" name="deathsLoss" min="0" defaultValue="0" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sales/Removed</label>
                  <input type="number" name="salesRemoved" min="0" defaultValue="0" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <textarea name="remarks" rows={2} className="w-full px-3 py-2 border rounded-lg"></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivestockInventory;

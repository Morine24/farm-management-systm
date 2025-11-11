import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Activity, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Animal {
  id: string;
  type: 'cattle' | 'goat' | 'sheep' | 'pig' | 'chicken' | 'duck' | 'turkey' | 'other';
  category: 'livestock' | 'poultry';
  tagId: string;
  breed: string;
  age: number;
  weight: number;
  gender: 'male' | 'female';
  healthStatus: 'healthy' | 'sick' | 'quarantine';
  farmId?: string;
  farmName?: string;
  purchaseDate: Date;
  purchasePrice: number;
  notes?: string;
}

const Livestock: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [filter, setFilter] = useState<'all' | 'livestock' | 'poultry'>('all');
  const [activeTab, setActiveTab] = useState<'animals' | 'inventory' | 'productivity' | 'feeding'>('animals');
  const [inventoryRecords, setInventoryRecords] = useState<any[]>([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [productivityRecords, setProductivityRecords] = useState<any[]>([]);
  const [showProductivityModal, setShowProductivityModal] = useState(false);
  const [feedingRecords, setFeedingRecords] = useState<any[]>([]);
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const [feedingDate, setFeedingDate] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();

  const animalTypes = ['Goats', 'Cows', 'Chicks', 'Geese', 'Guinea fowls', 'Sheep', 'Pigs', 'Ducks', 'Turkeys'];

  useEffect(() => {
    fetchAnimals();
    fetchFarms();
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventoryRecords();
    } else if (activeTab === 'productivity') {
      fetchProductivityRecords();
    } else if (activeTab === 'feeding') {
      fetchFeedingRecords();
    }
  }, [activeTab, selectedDate, feedingDate]);

  const fetchAnimals = async () => {
    const snapshot = await getDocs(collection(db, 'animals'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Animal[];
    setAnimals(data);
  };

  const fetchFarms = async () => {
    const snapshot = await getDocs(collection(db, 'farms'));
    setFarms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchInventoryRecords = async () => {
    const { query, where, Timestamp } = await import('firebase/firestore');
    const dateObj = new Date(selectedDate);
    const snapshot = await getDocs(
      query(collection(db, 'livestockInventory'), where('date', '==', Timestamp.fromDate(dateObj)))
    );
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));
    setInventoryRecords(data);
  };

  const handleInventorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { Timestamp } = await import('firebase/firestore');
    
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

    await addDoc(collection(db, 'livestockInventory'), recordData);
    setShowInventoryModal(false);
    fetchInventoryRecords();
  };

  const fetchProductivityRecords = async () => {
    const snapshot = await getDocs(collection(db, 'livestockProductivity'));
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));
    setProductivityRecords(data.sort((a: any, b: any) => b.date.getTime() - a.date.getTime()));
  };

  const handleProductivitySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { Timestamp } = await import('firebase/firestore');
    
    const recordData = {
      date: Timestamp.fromDate(new Date(formData.get('date') as string)),
      produce: formData.get('produce') as string,
      quantity: formData.get('quantity') as string
    };

    await addDoc(collection(db, 'livestockProductivity'), recordData);
    setShowProductivityModal(false);
    fetchProductivityRecords();
  };

  const fetchFeedingRecords = async () => {
    const { query, where, Timestamp } = await import('firebase/firestore');
    const dateObj = new Date(feedingDate);
    const snapshot = await getDocs(
      query(collection(db, 'poultryFeeding'), where('date', '==', Timestamp.fromDate(dateObj)))
    );
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));
    setFeedingRecords(data);
  };

  const handleFeedingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { Timestamp } = await import('firebase/firestore');
    
    const recordData = {
      date: Timestamp.fromDate(new Date(formData.get('date') as string)),
      poultryType: formData.get('poultryType') as string,
      feedType: formData.get('feedType') as string,
      feedingTime: formData.get('feedingTime') as string,
      waterProvided: formData.get('waterProvided') as string,
      supplements: formData.get('supplements') as string,
      observation: formData.get('observation') as string
    };

    await addDoc(collection(db, 'poultryFeeding'), recordData);
    setShowFeedingModal(false);
    fetchFeedingRecords();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const farmId = formData.get('farmId') as string;
    const selectedFarm = farms.find(f => f.id === farmId);

    const animalData = {
      type: formData.get('type') as string,
      category: ['chicken', 'duck', 'turkey'].includes(formData.get('type') as string) ? 'poultry' : 'livestock',
      tagId: formData.get('tagId') as string,
      breed: formData.get('breed') as string,
      age: parseFloat(formData.get('age') as string),
      weight: parseFloat(formData.get('weight') as string),
      gender: formData.get('gender') as string,
      healthStatus: formData.get('healthStatus') as string,
      farmId: farmId || undefined,
      farmName: selectedFarm?.name || undefined,
      purchaseDate: new Date(formData.get('purchaseDate') as string),
      purchasePrice: parseFloat(formData.get('purchasePrice') as string),
      notes: formData.get('notes') as string
    };

    if (editingAnimal) {
      await updateDoc(doc(db, 'animals', editingAnimal.id), animalData);
    } else {
      await addDoc(collection(db, 'animals'), animalData);
    }

    setShowModal(false);
    setEditingAnimal(null);
    fetchAnimals();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this animal?')) {
      await deleteDoc(doc(db, 'animals', id));
      fetchAnimals();
    }
  };

  const filteredAnimals = animals.filter(a => filter === 'all' || a.category === filter);
  const totalAnimals = filteredAnimals.length;
  const healthyCount = filteredAnimals.filter(a => a.healthStatus === 'healthy').length;
  const sickCount = filteredAnimals.filter(a => a.healthStatus === 'sick').length;
  const totalValue = filteredAnimals.reduce((sum, a) => sum + a.purchasePrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Livestock & Poultry Management</h1>
        <button
          onClick={() => {
            if (activeTab === 'animals') setShowModal(true);
            else if (activeTab === 'inventory') setShowInventoryModal(true);
            else if (activeTab === 'productivity') setShowProductivityModal(true);
            else setShowFeedingModal(true);
          }}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'animals' ? 'Add Animal' : activeTab === 'inventory' ? 'Add Record' : activeTab === 'productivity' ? 'Add Productivity' : 'Add Feeding'}
        </button>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-4 md:space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab('animals')}
            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
              activeTab === 'animals'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Animals Registry
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Daily Inventory
          </button>
          <button
            onClick={() => setActiveTab('productivity')}
            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
              activeTab === 'productivity'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Productivity
          </button>
          <button
            onClick={() => setActiveTab('feeding')}
            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
              activeTab === 'feeding'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Poultry Feeding
          </button>
        </nav>
      </div>

      {activeTab === 'animals' && (
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>All</button>
          <button onClick={() => setFilter('livestock')} className={`px-4 py-2 rounded-lg ${filter === 'livestock' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>Livestock</button>
          <button onClick={() => setFilter('poultry')} className={`px-4 py-2 rounded-lg ${filter === 'poultry' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>Poultry</button>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium mb-2">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
      )}

      {activeTab === 'feeding' && (
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium mb-2">Select Date</label>
          <input
            type="date"
            value={feedingDate}
            onChange={(e) => setFeedingDate(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
      )}

      {activeTab === 'animals' && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Animals</p>
          <p className="text-2xl font-bold">{totalAnimals}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Healthy</p>
          <p className="text-2xl font-bold text-green-600">{healthyCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Sick/Quarantine</p>
          <p className="text-2xl font-bold text-red-600">{sickCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-blue-600">${totalValue.toLocaleString()}</p>
        </div>
      </div>
      )}

      {activeTab === 'animals' && (
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAnimals.map(animal => (
              <tr key={animal.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{animal.tagId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{animal.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{animal.breed}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{animal.age} months</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{animal.weight} kg</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{animal.gender}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    animal.healthStatus === 'healthy' ? 'bg-green-100 text-green-800' :
                    animal.healthStatus === 'sick' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {animal.healthStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{animal.farmName || 'General'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button onClick={() => { setEditingAnimal(animal); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 mr-3">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(animal.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {activeTab === 'inventory' && (
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
            {inventoryRecords.map(record => (
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
      )}

      {activeTab === 'productivity' && (
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produce</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productivityRecords.map(record => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.date.toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{record.produce}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {activeTab === 'feeding' && (
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poultry Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feed Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feeding Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Water Provided</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplements</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observation</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {feedingRecords.map(record => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.date.toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{record.poultryType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.feedType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.feedingTime}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.waterProvided}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.supplements}</td>
                <td className="px-6 py-4 text-sm">{record.observation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">{editingAnimal ? 'Edit Animal' : 'Add Animal'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select name="type" required defaultValue={editingAnimal?.type} className="w-full px-3 py-2 border rounded-lg">
                    <option value="cattle">Cattle</option>
                    <option value="goat">Goat</option>
                    <option value="sheep">Sheep</option>
                    <option value="pig">Pig</option>
                    <option value="chicken">Chicken</option>
                    <option value="duck">Duck</option>
                    <option value="turkey">Turkey</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tag/ID</label>
                  <input type="text" name="tagId" required defaultValue={editingAnimal?.tagId} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Breed</label>
                  <input type="text" name="breed" required defaultValue={editingAnimal?.breed} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Age (months)</label>
                  <input type="number" name="age" required defaultValue={editingAnimal?.age} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                  <input type="number" step="0.1" name="weight" required defaultValue={editingAnimal?.weight} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select name="gender" required defaultValue={editingAnimal?.gender} className="w-full px-3 py-2 border rounded-lg">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Health Status</label>
                  <select name="healthStatus" required defaultValue={editingAnimal?.healthStatus} className="w-full px-3 py-2 border rounded-lg">
                    <option value="healthy">Healthy</option>
                    <option value="sick">Sick</option>
                    <option value="quarantine">Quarantine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Farm</label>
                  <select name="farmId" defaultValue={editingAnimal?.farmId} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">General</option>
                    {farms.map(farm => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Purchase Date</label>
                  <input type="date" name="purchaseDate" required defaultValue={editingAnimal?.purchaseDate ? (() => {
                    const date = editingAnimal.purchaseDate instanceof Date ? editingAnimal.purchaseDate : 
                                 (editingAnimal.purchaseDate as any).toDate ? (editingAnimal.purchaseDate as any).toDate() : 
                                 new Date(editingAnimal.purchaseDate);
                    return date.toISOString().split('T')[0];
                  })() : ''} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Purchase Price ($)</label>
                  <input type="number" step="0.01" name="purchasePrice" required defaultValue={editingAnimal?.purchasePrice} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea name="notes" rows={3} defaultValue={editingAnimal?.notes} className="w-full px-3 py-2 border rounded-lg"></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setShowModal(false); setEditingAnimal(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingAnimal ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeedingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add Poultry Feeding Record</h2>
            <form onSubmit={handleFeedingSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" name="date" required defaultValue={feedingDate} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Poultry Type</label>
                  <input type="text" name="poultryType" required placeholder="e.g., Mature Chicken, Chicks" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Feed Type</label>
                  <input type="text" name="feedType" required placeholder="e.g., Layers mash, Growers mash" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Feeding Time</label>
                  <input type="text" name="feedingTime" required placeholder="e.g., 8am and 4pm" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Water Provided</label>
                  <input type="text" name="waterProvided" required placeholder="e.g., 10 litres" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Supplements</label>
                  <input type="text" name="supplements" placeholder="e.g., 0.5 kgs Vegetables" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Observation</label>
                  <textarea name="observation" rows={2} placeholder="e.g., Actively eating" className="w-full px-3 py-2 border rounded-lg"></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowFeedingModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProductivityModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add Productivity Record</h2>
            <form onSubmit={handleProductivitySubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Produce</label>
                  <input type="text" name="produce" required placeholder="e.g., Eggs, Milk, Wool" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input type="text" name="quantity" required placeholder="e.g., 290kgs, 50 eggs" className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowProductivityModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInventoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add Livestock Record</h2>
            <form onSubmit={handleInventorySubmit}>
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
                <button type="button" onClick={() => setShowInventoryModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Livestock;

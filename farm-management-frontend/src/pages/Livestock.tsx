import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Activity } from 'lucide-react';
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

  useEffect(() => {
    fetchAnimals();
    fetchFarms();
  }, []);

  const fetchAnimals = async () => {
    const snapshot = await getDocs(collection(db, 'animals'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Animal[];
    setAnimals(data);
  };

  const fetchFarms = async () => {
    const snapshot = await getDocs(collection(db, 'farms'));
    setFarms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
          onClick={() => { setShowModal(true); setEditingAnimal(null); }}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Animal
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>All</button>
        <button onClick={() => setFilter('livestock')} className={`px-4 py-2 rounded-lg ${filter === 'livestock' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>Livestock</button>
        <button onClick={() => setFilter('poultry')} className={`px-4 py-2 rounded-lg ${filter === 'poultry' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>Poultry</button>
      </div>

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
    </div>
  );
};

export default Livestock;

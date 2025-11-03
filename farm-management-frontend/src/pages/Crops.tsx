import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, TrendingUp, Droplets, Sprout, Scissors, X } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { getCropList, getCropData, calculateHarvestDate, generateMaintenanceSchedule } from '../utils/cropDatabase';

const getCropMaintenance = (variety: string) => {
  const crop = variety.toLowerCase();
  if (crop.includes('maize') || crop.includes('corn')) {
    return [
      { task: 'Irrigation', frequency: 'Every 7-10 days', icon: Droplets },
      { task: 'Weeding', frequency: 'Every 2-3 weeks', icon: Scissors },
      { task: 'Fertilizer', frequency: 'Week 3, 6, 9', icon: Sprout },
      { task: 'Pest Control', frequency: 'Every 2 weeks', icon: Sprout }
    ];
  }
  if (crop.includes('bean') || crop.includes('soybean')) {
    return [
      { task: 'Irrigation', frequency: 'Every 5-7 days', icon: Droplets },
      { task: 'Weeding', frequency: 'Every 2 weeks', icon: Scissors },
      { task: 'Fertilizer', frequency: 'Week 2, 5', icon: Sprout },
      { task: 'Pest Control', frequency: 'Every 10 days', icon: Sprout }
    ];
  }
  if (crop.includes('tomato')) {
    return [
      { task: 'Irrigation', frequency: 'Daily', icon: Droplets },
      { task: 'Weeding', frequency: 'Weekly', icon: Scissors },
      { task: 'Fertilizer', frequency: 'Every 2 weeks', icon: Sprout },
      { task: 'Pruning', frequency: 'Weekly', icon: Scissors },
      { task: 'Pest Control', frequency: 'Every 7 days', icon: Sprout }
    ];
  }
  if (crop.includes('wheat')) {
    return [
      { task: 'Irrigation', frequency: 'Every 10-15 days', icon: Droplets },
      { task: 'Weeding', frequency: 'Every 3 weeks', icon: Scissors },
      { task: 'Fertilizer', frequency: 'Week 4, 8', icon: Sprout },
      { task: 'Pest Control', frequency: 'Every 3 weeks', icon: Sprout }
    ];
  }
  return [
    { task: 'Irrigation', frequency: 'As needed', icon: Droplets },
    { task: 'Weeding', frequency: 'Regular', icon: Scissors },
    { task: 'Fertilizer', frequency: 'Monthly', icon: Sprout },
    { task: 'Pest Control', frequency: 'Bi-weekly', icon: Sprout }
  ];
};

interface Crop {
  id: string;
  variety: string;
  farmId: string;
  farmName: string;
  sectionId: string;
  sectionName: string;
  plantingDate: string;
  harvestDate: string;
  expectedYield: number;
  status: 'planted' | 'growing' | 'harvested';
}

const Crops: React.FC = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [filterFarm, setFilterFarm] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [plantingDate, setPlantingDate] = useState<string>('');
  const [autoHarvestDate, setAutoHarvestDate] = useState<string>('');
  const [viewingCrop, setViewingCrop] = useState<Crop | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'crops'), (snapshot) => {
      const cropsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Crop));
      setCrops(cropsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'farms'), (snapshot) => {
      const farmsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFarms(farmsData);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      variety: formData.get('variety') as string,
      farmId: formData.get('farmId') as string,
      farmName: farms.find(f => f.id === formData.get('farmId'))?.name || '',
      sectionId: formData.get('sectionId') as string,
      sectionName: formData.get('sectionName') as string,
      plantingDate: formData.get('plantingDate') as string,
      harvestDate: formData.get('harvestDate') as string,
      expectedYield: Number(formData.get('expectedYield')),
      status: formData.get('status') as 'planted' | 'growing' | 'harvested',
    };

    try {
      if (editingCrop) {
        await updateDoc(doc(db, 'crops', editingCrop.id), data);
        toast.success('Crop updated');
      } else {
        await addDoc(collection(db, 'crops'), data);
        toast.success('Crop added');
      }
      setShowModal(false);
      setEditingCrop(null);
    } catch (error) {
      toast.error('Failed to save crop');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this crop?')) {
      try {
        await deleteDoc(doc(db, 'crops', id));
        toast.success('Crop deleted');
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  return (
    <div className="p-6">
      <Toaster />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Crop Management</h1>
        <div className="flex gap-3">
          <select value={filterFarm} onChange={(e) => setFilterFarm(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="">All Farms</option>
            {farms.map(farm => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />Add Crop
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harvest</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {crops.filter(c => !filterFarm || c.farmId === filterFarm).map(crop => (
              <tr key={crop.id} onClick={() => setViewingCrop(crop)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{crop.variety}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{crop.farmName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(crop.plantingDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(crop.harvestDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    crop.status === 'harvested' ? 'bg-green-100 text-green-800' :
                    crop.status === 'growing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {crop.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button onClick={(e) => { e.stopPropagation(); setEditingCrop(crop); setShowModal(true); }} className="text-blue-600 hover:text-blue-900 mr-3">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(crop.id); }} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{editingCrop ? 'Edit Crop' : 'Add Crop'}</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Farm</label>
                <select 
                  name="farmId" 
                  defaultValue={editingCrop?.farmId} 
                  required 
                  className="w-full px-3 py-2 border rounded-lg"
                  onChange={async (e) => {
                    const farmId = e.target.value;
                    if (farmId) {
                      onSnapshot(collection(db, 'sections'), (snapshot) => {
                        const sectionsData = snapshot.docs
                          .map(doc => ({ id: doc.id, ...doc.data() }))
                          .filter((s: any) => s.farmId === farmId);
                        setSections(sectionsData);
                      });
                    }
                  }}
                >
                  <option value="">Select Farm</option>
                  {farms.map(farm => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Crop Variety</label>
                <select 
                  name="variety" 
                  defaultValue={editingCrop?.variety}
                  required 
                  className="w-full px-3 py-2 border rounded-lg"
                  onChange={(e) => {
                    setSelectedCrop(e.target.value);
                    if (plantingDate && e.target.value) {
                      const harvestDate = calculateHarvestDate(plantingDate, e.target.value);
                      setAutoHarvestDate(harvestDate);
                    }
                  }}
                >
                  <option value="">Select Crop</option>
                  {getCropList().map(crop => <option key={crop} value={crop}>{crop}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Section</label>
                <select 
                  name="sectionId" 
                  defaultValue={editingCrop?.sectionId} 
                  required 
                  className="w-full px-3 py-2 border rounded-lg"
                  onChange={(e) => {
                    const section = sections.find(s => s.id === e.target.value);
                    if (section) {
                      const sectionNameInput = document.querySelector('input[name="sectionName"]') as HTMLInputElement;
                      if (sectionNameInput) sectionNameInput.value = section.name;
                    }
                  }}
                >
                  <option value="">Select Section</option>
                  {sections.map(section => <option key={section.id} value={section.id}>{section.name}</option>)}
                </select>
              </div>
              <input name="sectionName" type="hidden" defaultValue={editingCrop?.sectionName} />
              <div>
                <label className="block text-sm font-medium mb-1">Planting Date</label>
                <input 
                  name="plantingDate" 
                  type="date" 
                  defaultValue={editingCrop?.plantingDate} 
                  required 
                  className="w-full px-3 py-2 border rounded-lg"
                  onChange={(e) => {
                    setPlantingDate(e.target.value);
                    if (selectedCrop && e.target.value) {
                      const harvestDate = calculateHarvestDate(e.target.value, selectedCrop);
                      setAutoHarvestDate(harvestDate);
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Harvest Date (Auto-calculated)</label>
                <input 
                  name="harvestDate" 
                  type="date" 
                  value={autoHarvestDate || editingCrop?.harvestDate || ''} 
                  required 
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expected Yield (kg)</label>
                <input name="expectedYield" type="number" defaultValue={editingCrop?.expectedYield} required className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select name="status" defaultValue={editingCrop?.status || 'planted'} required className="w-full px-3 py-2 border rounded-lg">
                  <option value="planted">Planted</option>
                  <option value="growing">Growing</option>
                  <option value="harvested">Harvested</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingCrop(null); }} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  {editingCrop ? 'Update' : 'Add'}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewingCrop && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingCrop(null)}
          onKeyDown={(e) => e.key === 'Escape' && setViewingCrop(null)}
        >
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{viewingCrop.variety}</h2>
                <button onClick={() => setViewingCrop(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Farm</p>
                  <p className="font-medium">{viewingCrop.farmName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Section</p>
                  <p className="font-medium">{viewingCrop.sectionName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Planting Date</p>
                  <p className="font-medium">{new Date(viewingCrop.plantingDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Harvest Date</p>
                  <p className="font-medium">{new Date(viewingCrop.harvestDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expected Yield</p>
                  <p className="font-medium">{viewingCrop.expectedYield} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    viewingCrop.status === 'harvested' ? 'bg-green-100 text-green-800' :
                    viewingCrop.status === 'growing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {viewingCrop.status}
                  </span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Detailed Maintenance Schedule</h3>
                <div className="space-y-3">
                  {(() => {
                    const cropData = getCropData(viewingCrop.variety);
                    const schedule = generateMaintenanceSchedule(viewingCrop.plantingDate, viewingCrop.variety);
                    
                    if (schedule.length === 0) {
                      return (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-sm text-yellow-800">No maintenance schedule available for {viewingCrop.variety}.</p>
                          <p className="text-xs text-yellow-600 mt-1">Crop: {viewingCrop.variety} | Planting: {viewingCrop.plantingDate}</p>
                        </div>
                      );
                    }
                    
                    return schedule.map((task, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded border-l-4 border-green-500">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-sm text-gray-900">{task.type}</p>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Day {task.day}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        {task.type === 'Pest Control' && task.pesticides && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-600 mb-1">Recommended Pesticides:</p>
                            <div className="flex flex-wrap gap-1">
                              {task.pesticides.map((pesticide: string, pIdx: number) => (
                                <span key={pIdx} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  {pesticide}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
                
                {(() => {
                  const cropData = getCropData(viewingCrop.variety);
                  if (cropData) {
                    return (
                      <div className="mt-4 p-4 bg-blue-50 rounded">
                        <h4 className="font-semibold text-sm mb-2">Crop Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Optimal Temp:</span>
                            <span className="ml-1 font-medium">{cropData.optimalTemp}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Growth Days:</span>
                            <span className="ml-1 font-medium">{cropData.growthDays} days</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Soil Type:</span>
                            <span className="ml-1 font-medium">{cropData.soilType.join(', ')}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Yield/Acre:</span>
                            <span className="ml-1 font-medium">{cropData.yieldPerAcre} kg</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Crops;

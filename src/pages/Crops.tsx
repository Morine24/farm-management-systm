import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, TrendingUp, Droplets, Sprout, Scissors, X } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { getCropList, getCropData, calculateHarvestDate, generateMaintenanceSchedule } from '../utils/cropDatabase';
import { useUser } from '../contexts/UserContext';

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
  const { isWorker } = useUser();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [filterFarm, setFilterFarm] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [customCrop, setCustomCrop] = useState<string>('');
  const [showCustomCrop, setShowCustomCrop] = useState(false);
  const [plantingDate, setPlantingDate] = useState<string>('');
  const [autoHarvestDate, setAutoHarvestDate] = useState<string>('');
  const [viewingCrop, setViewingCrop] = useState<Crop | null>(null);
  const [showProductivityModal, setShowProductivityModal] = useState(false);
  const [productivityRecords, setProductivityRecords] = useState<any[]>([]);
  const [editingProductivity, setEditingProductivity] = useState<any>(null);
  const [showIrrigationModal, setShowIrrigationModal] = useState(false);
  const [irrigationRecords, setIrrigationRecords] = useState<any[]>([]);
  const [editingIrrigation, setEditingIrrigation] = useState<any>(null);
  const [irrigationDate, setIrrigationDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'crops' | 'productivity' | 'irrigation'>('crops');

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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'cropProductivity'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      }));
      setProductivityRecords(data.sort((a: any, b: any) => b.date.getTime() - a.date.getTime()));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTab === 'irrigation') {
      fetchIrrigationRecords();
    }
  }, [activeTab, irrigationDate]);

  const fetchIrrigationRecords = async () => {
    const { query, where, Timestamp, getDocs } = await import('firebase/firestore');
    const dateObj = new Date(irrigationDate);
    const snapshot = await getDocs(
      query(collection(db, 'irrigation'), where('date', '==', Timestamp.fromDate(dateObj)))
    );
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));
    setIrrigationRecords(data);
  };

  const handleProductivitySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { Timestamp } = await import('firebase/firestore');
    
    const farmId = formData.get('farmId') as string;
    const sectionId = formData.get('sectionId') as string;
    const farm = farms.find(f => f.id === farmId);
    const section = sections.find(s => s.id === sectionId);
    
    const recordData = {
      date: Timestamp.fromDate(new Date(formData.get('date') as string)),
      farmId,
      farmName: farm?.name || '',
      sectionId: sectionId || null,
      sectionName: section?.name || '',
      produce: formData.get('produce') as string,
      quantity: formData.get('quantity') as string
    };

    if (editingProductivity) {
      await updateDoc(doc(db, 'cropProductivity', editingProductivity.id), recordData);
      toast.success('Record updated');
    } else {
      await addDoc(collection(db, 'cropProductivity'), recordData);
      toast.success('Record added');
    }
    setShowProductivityModal(false);
    setEditingProductivity(null);
  };

  const handleIrrigationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { Timestamp } = await import('firebase/firestore');
    
    const farmId = formData.get('farmId') as string;
    const sectionId = formData.get('sectionId') as string;
    const farm = farms.find(f => f.id === farmId);
    const section = sections.find(s => s.id === sectionId);
    
    const recordData = {
      date: Timestamp.fromDate(new Date(formData.get('date') as string)),
      farmId,
      farmName: farm?.name || '',
      sectionId: sectionId || null,
      sectionName: section?.name || '',
      cropBlock: formData.get('cropBlock') as string,
      method: formData.get('method') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      frequency: formData.get('frequency') as string,
      remarks: formData.get('remarks') as string
    };

    if (editingIrrigation) {
      await updateDoc(doc(db, 'irrigation', editingIrrigation.id), recordData);
      toast.success('Record updated');
    } else {
      await addDoc(collection(db, 'irrigation'), recordData);
      toast.success('Record added');
    }
    setShowIrrigationModal(false);
    setEditingIrrigation(null);
    fetchIrrigationRecords();
  };

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
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl md:text-3xl font-bold">Crop Management</h1>
          {!isWorker && (
            <button
              onClick={() => {
                if (activeTab === 'crops') setShowModal(true);
                else if (activeTab === 'productivity') setShowProductivityModal(true);
                else setShowIrrigationModal(true);
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {activeTab === 'crops' ? 'Add Crop' : activeTab === 'productivity' ? 'Add Record' : 'Add Irrigation'}
            </button>
          )}
        </div>

        <div className="border-b border-gray-200 mb-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('crops')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'crops'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Crops
            </button>
            <button
              onClick={() => setActiveTab('productivity')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'productivity'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Productivity
            </button>
            <button
              onClick={() => setActiveTab('irrigation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'irrigation'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Irrigation
            </button>
          </nav>
        </div>

        {activeTab === 'irrigation' && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <label className="block text-sm font-medium mb-2">Select Date</label>
            <input
              type="date"
              value={irrigationDate}
              onChange={(e) => setIrrigationDate(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
        )}

        {activeTab === 'crops' && (
          <select value={filterFarm} onChange={(e) => setFilterFarm(e.target.value)} className="px-3 py-2 border rounded-lg w-48">
            <option value="">All Farms</option>
            {farms.map(farm => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
          </select>
        )}
      </div>

      {activeTab === 'crops' && (
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{crop.sectionName || '-'}</td>
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
                  {!isWorker ? (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setEditingCrop(crop); setShowModal(true); }} className="text-blue-600 hover:text-blue-900 mr-3">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(crop.id); }} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-500 text-xs">View Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {activeTab === 'productivity' && (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produce</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productivityRecords.map(record => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.date.toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.farmName || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.sectionName || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{record.produce}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {!isWorker && (
                    <>
                      <button onClick={async () => { 
                        setEditingProductivity(record); 
                        if (record.farmId) {
                          onSnapshot(collection(db, 'sections'), (snapshot) => {
                            const sectionsData = snapshot.docs
                              .map(doc => ({ id: doc.id, ...doc.data() }))
                              .filter((s: any) => s.farmId === record.farmId);
                            setSections(sectionsData);
                          });
                        }
                        setShowProductivityModal(true); 
                      }} className="text-blue-600 hover:text-blue-900 mr-3">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={async () => {
                        if (window.confirm('Delete this record?')) {
                          await deleteDoc(doc(db, 'cropProductivity', record.id));
                          toast.success('Record deleted');
                        }
                      }} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {activeTab === 'irrigation' && (
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop/Block</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Starting Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {irrigationRecords.map(record => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.date.toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.farmName || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.sectionName || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{record.cropBlock}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.method}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.startTime}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.endTime}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.frequency}</td>
                <td className="px-6 py-4 text-sm">{record.remarks}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {!isWorker && (
                    <>
                      <button onClick={async () => { 
                        setEditingIrrigation(record); 
                        if (record.farmId) {
                          onSnapshot(collection(db, 'sections'), (snapshot) => {
                            const sectionsData = snapshot.docs
                              .map(doc => ({ id: doc.id, ...doc.data() }))
                              .filter((s: any) => s.farmId === record.farmId);
                            setSections(sectionsData);
                          });
                        }
                        setShowIrrigationModal(true); 
                      }} className="text-blue-600 hover:text-blue-900 mr-3">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={async () => {
                        if (window.confirm('Delete this record?')) {
                          await deleteDoc(doc(db, 'irrigation', record.id));
                          toast.success('Record deleted');
                          fetchIrrigationRecords();
                        }
                      }} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

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
                  name="cropSelect"
                  value={showCustomCrop ? 'other' : selectedCrop}
                  onChange={(e) => {
                    if (e.target.value === 'other') {
                      setShowCustomCrop(true);
                      setSelectedCrop('');
                    } else {
                      setShowCustomCrop(false);
                      setSelectedCrop(e.target.value);
                      if (plantingDate && e.target.value) {
                        const harvestDate = calculateHarvestDate(plantingDate, e.target.value);
                        setAutoHarvestDate(harvestDate);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  required={!showCustomCrop}
                >
                  <option value="">Select Crop</option>
                  {getCropList().map(crop => <option key={crop} value={crop}>{crop}</option>)}
                  <option value="other">Other (Type custom crop)</option>
                </select>
                {showCustomCrop && (
                  <input
                    type="text"
                    value={customCrop}
                    onChange={(e) => {
                      setCustomCrop(e.target.value);
                      setSelectedCrop(e.target.value);
                    }}
                    placeholder="Enter crop name"
                    className="w-full px-3 py-2 border rounded-lg mt-2"
                    required
                  />
                )}
                <input type="hidden" name="variety" value={showCustomCrop ? customCrop : selectedCrop} />
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

      {showIrrigationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">{editingIrrigation ? 'Edit' : 'Add'} Irrigation Record</h2>
            <form onSubmit={handleIrrigationSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" name="date" required defaultValue={editingIrrigation ? editingIrrigation.date.toISOString().split('T')[0] : irrigationDate} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Farm</label>
                  <select 
                    name="farmId" 
                    required 
                    defaultValue={editingIrrigation?.farmId}
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
                      } else {
                        setSections([]);
                      }
                    }}
                  >
                    <option value="">Select farm</option>
                    {farms.map(farm => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <select name="sectionId" defaultValue={editingIrrigation?.sectionId} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Select section (optional)</option>
                    {sections.map(section => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Crop/Block</label>
                  <input type="text" name="cropBlock" required defaultValue={editingIrrigation?.cropBlock} placeholder="e.g., Elephant farm" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Method Used</label>
                  <input type="text" name="method" required defaultValue={editingIrrigation?.method} placeholder="e.g., Drip, Sprinkler" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Starting Time</label>
                  <input type="text" name="startTime" required defaultValue={editingIrrigation?.startTime} placeholder="e.g., 8am" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input type="text" name="endTime" required defaultValue={editingIrrigation?.endTime} placeholder="e.g., 1pm" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <input type="text" name="frequency" required defaultValue={editingIrrigation?.frequency} placeholder="e.g., Twice weekly, Daily" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <textarea name="remarks" rows={2} defaultValue={editingIrrigation?.remarks} placeholder="e.g., Onions, Thyme blocks and 2 Vegetable blocks" className="w-full px-3 py-2 border rounded-lg"></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setShowIrrigationModal(false); setEditingIrrigation(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingIrrigation ? 'Update' : 'Add'} Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProductivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{editingProductivity ? 'Edit' : 'Add'} Productivity Record</h2>
            <form onSubmit={handleProductivitySubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" name="date" required defaultValue={editingProductivity ? editingProductivity.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Farm</label>
                  <select 
                    name="farmId" 
                    required 
                    defaultValue={editingProductivity?.farmId} 
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
                      } else {
                        setSections([]);
                      }
                    }}
                  >
                    <option value="">Select farm</option>
                    {farms.map(farm => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <select name="sectionId" defaultValue={editingProductivity?.sectionId} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Select section (optional)</option>
                    {sections.map(section => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Produce</label>
                  <input type="text" name="produce" required defaultValue={editingProductivity?.produce} placeholder="e.g., Basil, Tomatoes" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input type="text" name="quantity" required defaultValue={editingProductivity?.quantity} placeholder="e.g., 290kgs" className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setShowProductivityModal(false); setEditingProductivity(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingProductivity ? 'Update' : 'Add'} Record</button>
              </div>
            </form>
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
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-green-900 mb-1">Expected Harvest Date</h3>
                  <p className="text-2xl font-bold text-green-700">{new Date(viewingCrop.harvestDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-sm text-green-600 mt-1">{Math.ceil((new Date(viewingCrop.harvestDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining</p>
                </div>
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
                        {task.type === 'Fertilizer' && (task as any).fertilizers && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-600 mb-1">Recommended Fertilizers:</p>
                            <div className="flex flex-wrap gap-1">
                              {(task as any).fertilizers.map((fertilizer: string, fIdx: number) => (
                                <span key={fIdx} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  {fertilizer}
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

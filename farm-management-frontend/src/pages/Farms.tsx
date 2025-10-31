import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Droplets, ThermometerSun, ArrowLeft, Layers } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

interface Farm {
  id: string;
  name: string;
  area: number;
  soilType: string;
  coordinates: number[][];
  soilHealth: {
    ph: number;
    moisture: number;
    temperature: number;
    lastUpdated: Date;
  };
}

interface Section {
  id: string;
  name: string;
  area: number;
  type: string;
  parentId?: string;
  farmId: string;
}

interface Block {
  id: string;
  sectionId: string;
  name: string;
  cropType: string;
  status: string;
  area: number;
  type?: string;
  parentId: string;
  farmId: string;
}

interface Bed {
  id: string;
  blockId: string;
  name: string;
  length: number;
  width: number;
  cropType: string;
  status: string;
  parentId: string;
  farmId: string;
}

interface DripLine {
  id: string;
  bedId: string;
  name: string;
  flowRate: number;
  status: string;
}

type ModalType = {
  type: 'section' | 'block' | 'bed' | 'dripline';
  parentId: string;
  data?: any;
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const getSoilHealthColor = (ph: number) => {
  if (ph >= 6.0 && ph <= 7.5) return 'text-green-600';
  if (ph >= 5.5 && ph <= 8.0) return 'text-yellow-600';
  return 'text-red-600';
};

const Farms: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [structureModal, setStructureModal] = useState<ModalType | null>(null);
  const [isLoadingSections, setIsLoadingSections] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'farms'), (snapshot) => {
      const farmsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Farm));
      setFarms(farmsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedFarm) {
      setIsLoadingSections(true);
      const sectionQuery = query(collection(db, 'sections'), where('farmId', '==', selectedFarm.id));
      const unsubscribe = onSnapshot(sectionQuery, (snapshot) => {
        const sectionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section));
        setSections(sectionsData);
        setIsLoadingSections(false);
      });
      return () => unsubscribe();
    } else {
      setSections([]);
    }
  }, [selectedFarm]);

  const handleAddFarm = async (farmData: Partial<Farm>) => {
    try {
      await addDoc(collection(db, 'farms'), farmData);
      setShowAddModal(false);
      toast.success('Farm added successfully');
    } catch (error) {
      console.error('Failed to add farm:', error);
      toast.error('Failed to add farm');
    }
  };

  const handleDeleteFarm = async (farmId: string) => {
    if (window.confirm('Delete this farm?')) {
      try {
        await deleteDoc(doc(db, 'farms', farmId));
        toast.success('Farm deleted successfully');
      } catch (error) {
        console.error('Failed to delete farm:', error);
        toast.error('Failed to delete farm');
      }
    }
  };

  const handleEditFarm = async (farmData: Partial<Farm>) => {
    if (!editingFarm) return;
    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'farms', editingFarm.id), farmData);
      setEditingFarm(null);
      toast.success('Farm updated successfully');
    } catch (error) {
      console.error('Failed to update farm:', error);
      toast.error('Failed to update farm');
    }
  };

  const handleAddStructure = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!structureModal) return;

    const formData = new FormData(e.currentTarget);
    try {
      const name = formData.get('name') as string;
      
      switch (structureModal.type) {
        case 'section':
          const farmId = selectedFarm ? selectedFarm.id : formData.get('farmId') as string;
          const area = parseFloat(formData.get('area') as string);
          await axios.post(`${API_URL}/sections`, { name, area, farmId });
          toast.success(`Section "${name}" added successfully!`);
          break;
          
        case 'block':
          const sectionId = structureModal.parentId;
          const cropType = formData.get('cropType') as string;
          const blockStatus = formData.get('status') as string;
          await axios.post(`${API_URL}/blocks`, { 
            name, 
            sectionId, 
            cropType, 
            status: blockStatus,
            parentId: sectionId,
            farmId: selectedFarm?.id 
          });
          toast.success(`Block "${name}" added successfully!`);
          break;
          
        case 'bed':
          const blockId = structureModal.parentId;
          const length = parseFloat(formData.get('length') as string);
          const width = parseFloat(formData.get('width') as string);
          await axios.post(`${API_URL}/beds`, { 
            name, 
            blockId, 
            length, 
            width,
            parentId: blockId,
            farmId: selectedFarm?.id 
          });
          toast.success(`Bed "${name}" added successfully!`);
          break;
          
        case 'dripline':
          const bedId = structureModal.parentId;
          const flowRate = parseFloat(formData.get('flowRate') as string);
          await axios.post(`${API_URL}/driplines`, { 
            name, 
            bedId, 
            flowRate,
            status: 'working' 
          });
          toast.success(`Drip Line "${name}" added successfully!`);
          break;
      }
      
      setStructureModal(null);
    } catch (error) {
      console.error('Failed to add structure:', error);
      toast.error('Failed to add structure');
    }
  };

  const loadBlocks = async (sectionId: string) => {
    try {
      const res = await axios.get(`${API_URL}/blocks/section/${sectionId}`);
      return res.data;
    } catch (error) {
      console.error('Error loading blocks:', error);
      throw error;
    }
  };

  const loadBeds = async (blockId: string) => {
    try {
      const res = await axios.get(`${API_URL}/beds/block/${blockId}`);
      return res.data;
    } catch (error) {
      console.error('Error loading beds:', error);
      throw error;
    }
  };

  const loadDriplines = async (bedId: string) => {
    try {
      const res = await axios.get(`${API_URL}/driplines/bed/${bedId}`);
      return res.data;
    } catch (error) {
      console.error('Error loading driplines:', error);
      throw error;
    }
  };

  if (selectedFarm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSelectedFarm(null)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedFarm.name}</h1>
              <p className="text-sm text-gray-500">{selectedFarm.area} acres • {selectedFarm.soilType} soil</p>
            </div>
          </div>
          <button
            onClick={() => setStructureModal({ type: 'section', parentId: selectedFarm.id })}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">pH Level</span>
              <span className={`text-lg font-bold ${getSoilHealthColor(selectedFarm.soilHealth.ph)}`}>
                {selectedFarm.soilHealth.ph}
              </span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Moisture</span>
              <div className="flex items-center">
                <Droplets className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-lg font-bold">{selectedFarm.soilHealth.moisture}%</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Temperature</span>
              <div className="flex items-center">
                <ThermometerSun className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-lg font-bold">{selectedFarm.soilHealth.temperature}°C</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Layers className="h-5 w-5 mr-2" />
              Farm Structure
            </h2>
            <button
              onClick={() => setStructureModal({ type: 'section', parentId: selectedFarm.id })}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Section
            </button>
          </div>
          {isLoadingSections ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading sections...</p>
            </div>
          ) : sections.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sections yet. Click "Add Section" to create one.</p>
          ) : (
            <div className="space-y-4">
              {sections.map(section => (
                <SectionView 
                  key={section.id} 
                  section={section} 
                  loadBlocks={loadBlocks} 
                  loadBeds={loadBeds} 
                  loadDriplines={loadDriplines} 
                  setStructureModal={setStructureModal}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Farm Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Farm
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setStructureModal({ type: 'section', parentId: '' })}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </button>
        <button
          onClick={() => setStructureModal({ type: 'block', parentId: '' })}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Block
        </button>
        <button
          onClick={() => setStructureModal({ type: 'bed', parentId: '' })}
          className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Bed
        </button>
        <button
          onClick={() => setStructureModal({ type: 'dripline', parentId: '' })}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Drip Line
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {farms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No farms yet. Add your first farm!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soil Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pH Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moisture</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {farms.map((farm) => (
                  <tr key={farm.id} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => setSelectedFarm(farm)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{farm.name}</div>
                      <div className="text-xs text-gray-500">ID: {farm.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{farm.area} acres</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {farm.soilType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-semibold ${getSoilHealthColor(farm.soilHealth.ph)}`}>
                          {farm.soilHealth.ph}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Droplets className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-sm text-gray-900">{farm.soilHealth.moisture}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ThermometerSun className="h-4 w-4 text-orange-500 mr-1" />
                        <span className="text-sm text-gray-900">{farm.soilHealth.temperature}°C</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingFarm(farm); }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteFarm(farm.id); }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Farm Modal */}
      {(showAddModal || editingFarm) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">{editingFarm ? 'Edit Farm' : 'Add New Farm'}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name') as string,
                area: Number(formData.get('area')),
                soilType: formData.get('soilType') as string,
              };
              if (editingFarm) {
                await handleEditFarm(data);
              } else {
                await handleAddFarm({
                  ...data,
                  coordinates: [],
                  soilHealth: { ph: 6.5, moisture: 45, temperature: 22, lastUpdated: new Date() }
                });
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingFarm?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area (acres)</label>
                  <input
                    type="number"
                    name="area"
                    required
                    step="0.1"
                    defaultValue={editingFarm?.area || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
                  <select
                    name="soilType"
                    required
                    defaultValue={editingFarm?.soilType || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select soil type</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Loam">Loam</option>
                    <option value="Silt">Silt</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingFarm(null); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingFarm ? 'Update' : 'Add Farm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Structure Modal */}
      {structureModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">
              Add {structureModal.type.charAt(0).toUpperCase() + structureModal.type.slice(1)}
            </h2>
            <form onSubmit={handleAddStructure} className="space-y-4">
              {structureModal.type === 'section' && !selectedFarm && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Farm</label>
                  <select 
                    name="farmId" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Choose a farm</option>
                    {farms.map(farm => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  name="name" 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                />
              </div>

              {structureModal.type === 'section' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area (acres)</label>
                  <input 
                    name="area" 
                    type="number" 
                    step="0.1" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                  />
                </div>
              )}

              {structureModal.type === 'block' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type</label>
                    <input 
                      name="cropType" 
                      required 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select 
                      name="status" 
                      required 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}

              {structureModal.type === 'bed' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Length (m)</label>
                    <input 
                      name="length" 
                      type="number" 
                      step="0.1" 
                      required 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Width (m)</label>
                    <input 
                      name="width" 
                      type="number" 
                      step="0.1" 
                      required 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                    />
                  </div>
                </>
              )}

              {structureModal.type === 'dripline' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flow Rate (L/h)</label>
                  <input 
                    name="flowRate" 
                    type="number" 
                    step="0.1" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStructureModal(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Add {structureModal.type.charAt(0).toUpperCase() + structureModal.type.slice(1)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SectionView: React.FC<{ section: Section; loadBlocks: any; loadBeds: any; loadDriplines: any; setStructureModal: (modal: ModalType) => void }> = ({ section, loadBlocks, loadBeds, loadDriplines, setStructureModal }) => {
  const [expanded, setExpanded] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);

  const handleToggleExpand = async (e: React.MouseEvent) => {
    e.preventDefault();
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    
    if (newExpanded && blocks.length === 0) {
      setIsLoadingBlocks(true);
      try {
        const loadedBlocks = await loadBlocks(section.id);
        setBlocks(loadedBlocks);
      } catch (error) {
        console.error('Error loading blocks:', error);
        toast.error('Failed to load blocks');
      } finally {
        setIsLoadingBlocks(false);
      }
    }
  };

  return (
    <div className="border rounded-lg">
      <div className="p-3 bg-gray-50 hover:bg-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex-1 cursor-pointer" onClick={handleToggleExpand}>
            <span className="font-medium">{section.name}</span>
            <span className="text-sm text-gray-500 ml-2">({section.area} acres)</span>
            <span className="text-xs text-gray-500 ml-2">{expanded ? '▼' : '▶'}</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={(e) => { e.stopPropagation(); setStructureModal({ type: 'block', parentId: section.id }); }}
              className="flex items-center px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Block
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="p-3 space-y-2">
          {isLoadingBlocks ? (
            <p className="text-sm text-gray-500">Loading blocks...</p>
          ) : blocks.length === 0 ? (
            <p className="text-sm text-gray-500">No blocks in this section</p>
          ) : (
            blocks.map(block => <BlockView key={block.id} block={block} loadBeds={loadBeds} loadDriplines={loadDriplines} setStructureModal={setStructureModal} />)
          )}
        </div>
      )}
    </div>
  );
};

const BlockView: React.FC<{ block: Block; loadBeds: any; loadDriplines: any; setStructureModal: (modal: ModalType) => void }> = ({ block, loadBeds, loadDriplines, setStructureModal }) => {
  const [expanded, setExpanded] = useState(false);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [isLoadingBeds, setIsLoadingBeds] = useState(false);

  const handleToggleExpand = async (e: React.MouseEvent) => {
    e.preventDefault();
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    
    if (newExpanded && beds.length === 0) {
      setIsLoadingBeds(true);
      try {
        const loadedBeds = await loadBeds(block.id);
        setBeds(loadedBeds);
      } catch (error) {
        console.error('Error loading beds:', error);
        toast.error('Failed to load beds');
      } finally {
        setIsLoadingBeds(false);
      }
    }
  };

  return (
    <div className="border-l-2 border-blue-300 pl-4">
      <div className="p-2 bg-blue-50 rounded hover:bg-blue-100">
        <div className="flex justify-between items-center">
          <div className="flex-1 cursor-pointer" onClick={handleToggleExpand}>
            <span className="font-medium text-sm">{block.name}</span>
            <span className="text-xs text-gray-600 ml-2">• {block.cropType}</span>
            <span className="text-xs ml-2">{expanded ? '▼' : '▶'}</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={(e) => { e.stopPropagation(); setStructureModal({ type: 'bed', parentId: block.id }); }}
              className="flex items-center px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Bed
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="mt-2 space-y-2">
          {isLoadingBeds ? (
            <p className="text-xs text-gray-500">Loading beds...</p>
          ) : beds.length === 0 ? (
            <p className="text-xs text-gray-500">No beds in this block</p>
          ) : (
            beds.map(bed => <BedView key={bed.id} bed={bed} loadDriplines={loadDriplines} setStructureModal={setStructureModal} />)
          )}
        </div>
      )}
    </div>
  );
};

const BedView: React.FC<{ bed: Bed; loadDriplines: any; setStructureModal: (modal: ModalType) => void }> = ({ bed, loadDriplines, setStructureModal }) => {
  const [expanded, setExpanded] = useState(false);
  const [driplines, setDriplines] = useState<DripLine[]>([]);

  useEffect(() => {
    if (expanded) {
      loadDriplines(bed.id).then(setDriplines);
    }
  }, [expanded, bed.id]);

  return (
    <div className="border-l-2 border-green-300 pl-4">
      <div className="p-2 bg-green-50 rounded hover:bg-green-100">
        <div className="flex justify-between items-center">
          <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <span className="font-medium text-sm">{bed.name}</span>
            <span className="text-xs text-gray-600 ml-2">• {bed.length}m × {bed.width}m</span>
            <span className="text-xs ml-2">{expanded ? '▼' : '▶'}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setStructureModal({ type: 'dripline', parentId: bed.id }); }}
            className="flex items-center px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Drip Line
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-2 space-y-1">
          {driplines.length === 0 ? (
            <p className="text-xs text-gray-500">No drip lines in this bed</p>
          ) : (
            driplines.map(drip => (
              <div key={drip.id} className="p-2 bg-gray-50 rounded text-xs">
                <span className="font-medium">{drip.name}</span>
                <span className="text-gray-600 ml-2">• {drip.flowRate} L/h</span>
                <span className={`ml-2 px-2 py-0.5 rounded ${drip.status === 'working' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {drip.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Farms;
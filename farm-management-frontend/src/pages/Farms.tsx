import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Droplets, ThermometerSun, ArrowLeft, Layers, Calendar, TrendingUp } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUser } from '../contexts/UserContext';

interface Farm {
  id: string;
  name: string;
  area: number;
  soilType: string;
  coordinates: [number, number][];
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

const FarmTreeView: React.FC<{
  farm: Farm;
  selectedFarm: Farm | null;
  selectedSection: Section | null;
  selectedBlock: Block | null;
  selectedBed: Bed | null;
  setSelectedFarm: (farm: Farm) => void;
  setSelectedSection: (section: Section | null) => void;
  setSelectedBlock: (block: Block | null) => void;
  setSelectedBed: (bed: Bed | null) => void;
}> = ({ farm, selectedFarm, setSelectedFarm, setSelectedSection, setSelectedBlock, setSelectedBed }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) {
      const unsubscribe = onSnapshot(query(collection(db, 'sections'), where('farmId', '==', farm.id)), (snapshot) => {
        setSections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section)));
      });
      return () => unsubscribe();
    }
  }, [expanded, farm.id]);

  return (
    <div className="border-l-2 border-gray-200 pl-2">
      <div 
        className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${
          selectedFarm?.id === farm.id ? 'bg-blue-100' : ''
        }`}
        onClick={() => {
          setSelectedFarm(farm);
          setSelectedSection(null);
          setSelectedBlock(null);
          setSelectedBed(null);
        }}
      >
        <div className="flex items-center">
          <span 
            className="mr-2 text-xs cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {sections.length > 0 ? (expanded ? '▼' : '▶') : '•'}
          </span>
          <span className="font-medium">{farm.name}</span>
        </div>
      </div>
      {expanded && sections.map(section => (
        <SectionTreeView key={section.id} section={section} setSelectedSection={setSelectedSection} setSelectedBlock={setSelectedBlock} setSelectedBed={setSelectedBed} />
      ))}
    </div>
  );
};

const SectionTreeView: React.FC<{
  section: Section;
  setSelectedSection: (section: Section) => void;
  setSelectedBlock: (block: Block | null) => void;
  setSelectedBed: (bed: Bed | null) => void;
}> = ({ section, setSelectedSection, setSelectedBlock, setSelectedBed }) => {
  return (
    <div 
      className="ml-4 p-1 rounded cursor-pointer hover:bg-gray-100"
      onClick={() => {
        setSelectedSection(section);
        setSelectedBlock(null);
        setSelectedBed(null);
      }}
    >
      <span className="text-sm">{section.name}</span>
    </div>
  );
};

const DetailsPanel: React.FC<{
  selectedFarm: Farm | null;
  selectedSection: Section | null;
  selectedBlock: Block | null;
  selectedBed: Bed | null;
}> = ({ selectedFarm, selectedSection, selectedBlock, selectedBed }) => {
  if (selectedBed) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Bed Details</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">{selectedBed.name}</h3>
          <p>Dimensions: {selectedBed.length}m × {selectedBed.width}m</p>
          <p>Area: {(selectedBed.length * selectedBed.width).toFixed(1)} m²</p>
        </div>
      </div>
    );
  }

  if (selectedBlock) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Block Details</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">{selectedBlock.name}</h3>
          <p>Crop: {selectedBlock.cropType}</p>
          <p>Status: {selectedBlock.status}</p>
        </div>
      </div>
    );
  }

  if (selectedSection) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Section Details</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">{selectedSection.name}</h3>
          <p>Area: {selectedSection.area} acres</p>
        </div>
      </div>
    );
  }

  if (selectedFarm) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Farm Details</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">{selectedFarm.name}</h3>
          <p>Area: {selectedFarm.area} acres</p>
          <p>Soil Type: {selectedFarm.soilType}</p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">pH Level</p>
              <p className={`text-lg font-bold ${getSoilHealthColor(selectedFarm.soilHealth.ph)}`}>
                {selectedFarm.soilHealth.ph}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Moisture</p>
              <p className="text-lg font-bold text-blue-600">{selectedFarm.soilHealth.moisture}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Temperature</p>
              <p className="text-lg font-bold text-orange-600">{selectedFarm.soilHealth.temperature}°C</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <p className="text-gray-500">Select a farm, section, block, or bed to view details</p>
    </div>
  );
};

const Farms: React.FC = () => {
  const { user } = useUser();
  const isManager = user?.role === 'manager';
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [structureModal, setStructureModal] = useState<ModalType | null>(null);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [selectedModalFarm, setSelectedModalFarm] = useState<Farm | null>(null);
  const [modalSections, setModalSections] = useState<Section[]>([]);
  const [modalBlocks, setModalBlocks] = useState<Block[]>([]);
  const [modalBeds, setModalBeds] = useState<Bed[]>([]);
  const [isLoadingModalSections, setIsLoadingModalSections] = useState(false);
  const [expandedFarms, setExpandedFarms] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [farmSections, setFarmSections] = useState<{[key: string]: Section[]}>({});
  const [sectionBlocks, setSectionBlocks] = useState<{[key: string]: Block[]}>({});
  const [blockBeds, setBlockBeds] = useState<{[key: string]: Bed[]}>({});

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
          const sectionId = structureModal.parentId || formData.get('sectionId') as string;
          const cropType = formData.get('cropType') as string;
          const blockStatus = formData.get('status') as string;
          await axios.post(`${API_URL}/blocks`, { 
            name, 
            sectionId, 
            cropType, 
            status: blockStatus
          });
          toast.success(`Block "${name}" added successfully!`);
          break;
          
        case 'bed':
          const blockId = structureModal.parentId || formData.get('blockId') as string;
          const length = parseFloat(formData.get('length') as string);
          const width = parseFloat(formData.get('width') as string);
          await axios.post(`${API_URL}/beds`, { 
            name, 
            blockId, 
            length, 
            width
          });
          toast.success(`Bed "${name}" added successfully!`);
          break;
          
        case 'dripline':
          const bedId = structureModal.parentId || formData.get('bedId') as string;
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
      setSelectedModalFarm(null);
      setModalSections([]);
      setModalBlocks([]);
      setModalBeds([]);
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

  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'health'>('overview');
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [operations, setOperations] = useState<any[]>([]);
  const [soilHealthHistory, setSoilHealthHistory] = useState<any[]>([]);

  useEffect(() => {
    if (selectedFarm) {
      const unsubOps = onSnapshot(query(collection(db, 'operations'), where('farmId', '==', selectedFarm.id)), (snapshot) => {
        setOperations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      const unsubHealth = onSnapshot(query(collection(db, 'soilHealthHistory'), where('farmId', '==', selectedFarm.id)), (snapshot) => {
        setSoilHealthHistory(snapshot.docs.map(doc => doc.data()).sort((a: any, b: any) => a.date - b.date));
      });
      return () => { unsubOps(); unsubHealth(); };
    }
  }, [selectedFarm]);

  if (selectedFarm) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSelectedFarm(null)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedFarm.name}</h1>
              <p className="text-sm text-gray-500">{selectedFarm.area} acres • {selectedFarm.soilType} soil</p>
            </div>
          </div>
          {!isManager && (
            <button onClick={() => setEditingFarm(selectedFarm)} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              <Edit className="h-4 w-4 inline mr-1" />Edit
            </button>
          )}
        </div>

        <div className="border-b bg-white overflow-x-auto">
          <div className="flex space-x-1 px-4 min-w-max">
            {[{ id: 'overview', label: 'Overview', icon: Layers }, { id: 'operations', label: 'Operations', icon: Calendar }, { id: 'health', label: 'Soil Health', icon: TrendingUp }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-3 md:px-4 py-3 font-medium text-xs md:text-sm flex items-center space-x-1 md:space-x-2 border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <tab.icon className="h-4 w-4" /><span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 gap-3 mb-6">
                <div className="bg-white p-3 rounded-lg shadow-sm border">
                  <p className="text-xs text-gray-500 mb-1">pH Level</p>
                  <p className={`text-xl font-bold ${getSoilHealthColor(selectedFarm.soilHealth.ph)}`}>{selectedFarm.soilHealth.ph}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border">
                  <p className="text-xs text-gray-500 mb-1">Moisture</p>
                  <div className="flex items-center">
                    <Droplets className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-xl font-bold text-blue-600">{selectedFarm.soilHealth.moisture}%</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border">
                  <p className="text-xs text-gray-500 mb-1">Temperature</p>
                  <div className="flex items-center">
                    <ThermometerSun className="h-4 w-4 text-orange-500 mr-2" />
                    <span className="text-xl font-bold text-orange-600">{selectedFarm.soilHealth.temperature}°C</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold flex items-center"><Layers className="h-5 w-5 mr-2 text-green-600" />Farm Structure</h2>
                </div>
                <div className="p-4">
                  {isLoadingSections ? <p className="text-gray-500 text-center py-8">Loading...</p> : sections.length === 0 ? <p className="text-gray-500 text-center py-8">No sections yet</p> : (
                    <div className="space-y-3">{sections.map(section => <SectionView key={section.id} section={section} loadBlocks={loadBlocks} loadBeds={loadBeds} loadDriplines={loadDriplines} setStructureModal={setStructureModal} />)}</div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'operations' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Planned Operations</h2>
                <button onClick={() => setShowOperationModal(true)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  <Plus className="h-3 w-3 inline mr-1" />Schedule Operation
                </button>
              </div>
              <div className="p-4">
                {operations.length === 0 ? <p className="text-gray-500 text-center py-8">No operations scheduled</p> : (
                  <div className="space-y-2">
                    {operations.map(op => (
                      <div key={op.id} className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{op.type}</p>
                          <p className="text-sm text-gray-500">{op.targetArea} • {new Date(op.scheduledDate?.toDate()).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${op.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{op.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold mb-4">Soil Health Trends</h2>
              {soilHealthHistory.length === 0 ? <p className="text-gray-500 text-center py-8">No historical data available</p> : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={soilHealthHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="ph" stroke="#10b981" name="pH" />
                    <Line type="monotone" dataKey="moisture" stroke="#3b82f6" name="Moisture %" />
                    <Line type="monotone" dataKey="temperature" stroke="#f59e0b" name="Temp °C" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="p-4 md:p-6 border-b bg-white shadow-sm">
        <div className="mb-4">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Farm Manager</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Manage your farms, sections, blocks, and beds</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isManager && (
            <button 
              onClick={() => setShowAddModal(true)} 
              className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Add </span>Farm
            </button>
          )}
          <button 
            onClick={() => setStructureModal({ type: 'section', parentId: '' })} 
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Add </span>Section
          </button>
          <button 
            onClick={() => setStructureModal({ type: 'block', parentId: '' })} 
            className="flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Add </span>Block
          </button>
          <button 
            onClick={() => setStructureModal({ type: 'bed', parentId: '' })} 
            className="flex items-center px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Add </span>Bed
          </button>
          <button 
            onClick={() => setStructureModal({ type: 'dripline', parentId: '' })} 
            className="flex items-center px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Add </span>Dripline
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4">Farms</h2>
          {farms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No farms yet. Create your first farm to get started.</p>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2 inline" />
                Add Your First Farm
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soil Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pH Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moisture</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {farms.map(farm => {
                    const isExpanded = expandedFarms.has(farm.id);
                    const sections = farmSections[farm.id] || [];
                    return (
                      <React.Fragment key={farm.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button onClick={async (e) => {
                              e.stopPropagation();
                              const newExpanded = new Set(expandedFarms);
                              if (isExpanded) {
                                newExpanded.delete(farm.id);
                              } else {
                                newExpanded.add(farm.id);
                                if (!farmSections[farm.id]) {
                                  const q = query(collection(db, 'sections'), where('farmId', '==', farm.id));
                                  const snapshot = await onSnapshot(q, (snap) => {
                                    setFarmSections(prev => ({...prev, [farm.id]: snap.docs.map(d => ({id: d.id, ...d.data()} as Section))}));
                                  });
                                }
                              }
                              setExpandedFarms(newExpanded);
                            }} className="text-gray-500 hover:text-gray-700">
                              {isExpanded ? '▼' : '▶'}
                            </button>
                          </td>
                          <td onClick={() => setSelectedFarm(farm)} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer">{farm.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{farm.area} acres</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{farm.soilType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-semibold ${getSoilHealthColor(farm.soilHealth.ph)}`}>{farm.soilHealth.ph}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{farm.soilHealth.moisture}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{farm.soilHealth.temperature}°C</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {!isManager ? (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); setEditingFarm(farm); }} className="text-blue-600 hover:text-blue-900 mr-3">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFarm(farm.id); }} className="text-red-600 hover:text-red-900">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <span className="text-gray-500 text-xs">View Only</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && sections.length > 0 && sections.map(section => {
                          const isSectionExpanded = expandedSections.has(section.id);
                          const blocks = sectionBlocks[section.id] || [];
                          return (
                            <React.Fragment key={section.id}>
                              <tr className="bg-blue-50">
                                <td></td>
                                <td colSpan={7} className="px-6 py-2">
                                  <div className="ml-4 text-sm flex items-center">
                                    <button onClick={async (e) => {
                                      e.stopPropagation();
                                      const newExpanded = new Set(expandedSections);
                                      if (isSectionExpanded) {
                                        newExpanded.delete(section.id);
                                      } else {
                                        newExpanded.add(section.id);
                                        if (!sectionBlocks[section.id]) {
                                          const blocks = await loadBlocks(section.id);
                                          setSectionBlocks(prev => ({...prev, [section.id]: blocks}));
                                        }
                                      }
                                      setExpandedSections(newExpanded);
                                    }} className="text-blue-600 hover:text-blue-800 mr-2">
                                      {isSectionExpanded ? '▼' : '▶'}
                                    </button>
                                    <span className="font-semibold text-blue-900">📁 {section.name}</span>
                                    <span className="text-blue-600 ml-2">({section.area} acres)</span>
                                  </div>
                                </td>
                              </tr>
                              {isSectionExpanded && blocks.length > 0 && blocks.map(block => {
                                const isBlockExpanded = expandedBlocks.has(block.id);
                                const beds = blockBeds[block.id] || [];
                                return (
                                  <React.Fragment key={block.id}>
                                    <tr className="bg-purple-50">
                                      <td></td>
                                      <td colSpan={7} className="px-6 py-2">
                                        <div className="ml-8 text-sm flex items-center">
                                          <button onClick={async (e) => {
                                            e.stopPropagation();
                                            const newExpanded = new Set(expandedBlocks);
                                            if (isBlockExpanded) {
                                              newExpanded.delete(block.id);
                                            } else {
                                              newExpanded.add(block.id);
                                              if (!blockBeds[block.id]) {
                                                const beds = await loadBeds(block.id);
                                                setBlockBeds(prev => ({...prev, [block.id]: beds}));
                                              }
                                            }
                                            setExpandedBlocks(newExpanded);
                                          }} className="text-purple-600 hover:text-purple-800 mr-2">
                                            {isBlockExpanded ? '▼' : '▶'}
                                          </button>
                                          <span className="font-semibold text-purple-900">📦 {block.name}</span>
                                          <span className="text-purple-600 ml-2">({block.cropType})</span>
                                        </div>
                                      </td>
                                    </tr>
                                    {isBlockExpanded && beds.length > 0 && beds.map(bed => (
                                      <tr key={bed.id} className="bg-green-50">
                                        <td></td>
                                        <td colSpan={7} className="px-6 py-2">
                                          <div className="ml-12 text-sm">
                                            <span className="font-semibold text-green-900">🌱 {bed.name}</span>
                                            <span className="text-green-600 ml-2">({bed.length}m × {bed.width}m)</span>
                                            <span className="text-green-700 ml-2 font-medium">• Crop: {bed.cropType || 'None'}</span>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                    {isBlockExpanded && beds.length === 0 && (
                                      <tr className="bg-gray-50">
                                        <td></td>
                                        <td colSpan={7} className="px-6 py-2 ml-12 text-sm text-gray-500 italic">No beds in this block</td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                              {isSectionExpanded && blocks.length === 0 && (
                                <tr className="bg-gray-50">
                                  <td></td>
                                  <td colSpan={7} className="px-6 py-2 ml-8 text-sm text-gray-500 italic">No blocks in this section</td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {isExpanded && sections.length === 0 && (
                          <tr className="bg-gray-50">
                            <td></td>
                            <td colSpan={7} className="px-6 py-2 text-sm text-gray-500 italic">No sections</td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Add {structureModal.type.charAt(0).toUpperCase() + structureModal.type.slice(1)}
              </h2>
              <form onSubmit={handleAddStructure} className="space-y-4">
              {!selectedFarm && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Farm</label>
                  <select 
                    name="farmId" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    onChange={async (e) => {
                      const farmId = e.target.value;
                      if (farmId) {
                        if (structureModal.type === 'block' || structureModal.type === 'bed' || structureModal.type === 'dripline') {
                          setIsLoadingModalSections(true);
                          setModalSections([]);
                          setModalBlocks([]);
                          setModalBeds([]);
                          try {
                            const q = query(collection(db, 'sections'), where('farmId', '==', farmId));
                            const snapshot = await getDocs(q);
                            const sectionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section));
                            setModalSections(sectionsData);
                          } catch (error) {
                            console.error('Error loading sections:', error);
                            toast.error('Failed to load sections');
                          } finally {
                            setIsLoadingModalSections(false);
                          }
                        }
                      } else {
                        setModalSections([]);
                        setModalBlocks([]);
                        setModalBeds([]);
                      }
                    }}
                  >
                    <option value="">Choose a farm</option>
                    {farms.map(farm => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {structureModal.type === 'section' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input 
                      name="name" 
                      required 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                    />
                  </div>
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
                </>
              )}

              {structureModal.type === 'block' && (
                <>
                  {!structureModal.parentId && !selectedFarm && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Section</label>
                      <select 
                        name="sectionId" 
                        required 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        disabled={isLoadingModalSections || modalSections.length === 0}
                      >
                        <option value="">{isLoadingModalSections ? 'Loading...' : modalSections.length === 0 ? 'Select a farm first' : 'Choose a section'}</option>
                        {modalSections.map(section => (
                          <option key={section.id} value={section.id}>{section.name}</option>
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
                  {!structureModal.parentId && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Section</label>
                        <select 
                          name="sectionId" 
                          required 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                          onChange={async (e) => {
                            const sectionId = e.target.value;
                            if (sectionId) {
                              try {
                                const response = await axios.get(`${API_URL}/blocks?sectionId=${sectionId}`);
                                setModalBlocks(response.data);
                              } catch (error) {
                                console.error('Error loading blocks:', error);
                              }
                            }
                          }}
                        >
                          <option value="">Choose a section</option>
                          {modalSections.map(section => (
                            <option key={section.id} value={section.id}>{section.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Block</label>
                        <select 
                          name="blockId" 
                          required 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Choose a block</option>
                          {modalBlocks.map(block => (
                            <option key={block.id} value={block.id}>{block.name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input 
                      name="name" 
                      required 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                    />
                  </div>
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
                <>
                  {!structureModal.parentId && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Section</label>
                        <select 
                          name="sectionId" 
                          required 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                          onChange={async (e) => {
                            const sectionId = e.target.value;
                            if (sectionId) {
                              try {
                                const response = await axios.get(`${API_URL}/blocks?sectionId=${sectionId}`);
                                setModalBlocks(response.data);
                              } catch (error) {
                                console.error('Error loading blocks:', error);
                              }
                            }
                          }}
                        >
                          <option value="">Choose a section</option>
                          {modalSections.map(section => (
                            <option key={section.id} value={section.id}>{section.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Block</label>
                        <select 
                          name="blockId" 
                          required 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                          onChange={async (e) => {
                            const blockId = e.target.value;
                            if (blockId) {
                              try {
                                const response = await axios.get(`${API_URL}/beds?blockId=${blockId}`);
                                setModalBeds(response.data);
                              } catch (error) {
                                console.error('Error loading beds:', error);
                              }
                            }
                          }}
                        >
                          <option value="">Choose a block</option>
                          {modalBlocks.map(block => (
                            <option key={block.id} value={block.id}>{block.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Bed</label>
                        <select 
                          name="bedId" 
                          required 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Choose a bed</option>
                          {modalBeds.map(bed => (
                            <option key={bed.id} value={bed.id}>{bed.name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input 
                      name="name" 
                      required 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                    />
                  </div>
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
                </>
              )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setStructureModal(null);
                      setSelectedModalFarm(null);
                      setModalSections([]);
                      setModalBlocks([]);
                      setModalBeds([]);
                    }}
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
        </div>
      )}

      {showOperationModal && selectedFarm && (() => {
        const currentFarm: Farm = selectedFarm;
        return (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Schedule Operation</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await addDoc(collection(db, 'operations'), {
                  farmId: currentFarm.id,
                  type: formData.get('type'),
                  targetArea: formData.get('targetArea'),
                  scheduledDate: new Date(formData.get('scheduledDate') as string),
                  status: 'pending',
                  createdAt: new Date()
                });
                setShowOperationModal(false);
                toast.success('Operation scheduled');
              }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operation Type</label>
                  <select name="type" required className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select type</option>
                    <option value="Plowing">Plowing</option>
                    <option value="Irrigation">Irrigation</option>
                    <option value="Fertilizing">Fertilizing</option>
                    <option value="Pest Control">Pest Control</option>
                    <option value="Harvesting">Harvesting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Area</label>
                  <input name="targetArea" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Section A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input name="scheduledDate" type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowOperationModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Schedule</button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}
    </div>
  );
};

const FarmStructureView: React.FC<{ farm: Farm; setSelectedFarm: (farm: Farm) => void; setEditingFarm: (farm: Farm) => void; handleDeleteFarm: (farmId: string) => void }> = ({ farm, setSelectedFarm, setEditingFarm, handleDeleteFarm }) => {
  const [farmSections, setFarmSections] = useState<Section[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) {
      const unsubscribe = onSnapshot(query(collection(db, 'sections'), where('farmId', '==', farm.id)), (snapshot) => {
        const sectionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section));
        setFarmSections(sectionsData);
      });
      return () => unsubscribe();
    }
  }, [expanded, farm.id]);

  return (
    <div className="border rounded-lg">
      <div className="p-4 bg-gray-50 hover:bg-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs text-gray-500">{expanded ? '▼' : '▶'}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{farm.name}</h3>
                <p className="text-xs sm:text-sm text-gray-500">{farm.area} acres • {farm.soilType} soil</p>
              </div>
              <div className="hidden sm:flex space-x-4">
                <span className={`text-sm ${getSoilHealthColor(farm.soilHealth.ph)}`}>pH: {farm.soilHealth.ph}</span>
                <span className="text-sm text-blue-600">{farm.soilHealth.moisture}%</span>
                <span className="text-sm text-orange-600">{farm.soilHealth.temperature}°C</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2 ml-4">
            <button onClick={() => setSelectedFarm(farm)} className="text-blue-600 hover:text-blue-900">
              <Edit className="h-4 w-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setEditingFarm(farm); }} className="text-green-600 hover:text-green-900">
              <Edit className="h-4 w-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleDeleteFarm(farm.id); }} className="text-red-600 hover:text-red-900">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="p-4 space-y-2">
          {farmSections.length === 0 ? (
            <p className="text-sm text-gray-500">No sections in this farm</p>
          ) : (
            farmSections.map(section => (
              <SectionView key={section.id} section={section} loadBlocks={() => {}} loadBeds={() => {}} loadDriplines={() => {}} setStructureModal={() => {}} />
            ))
          )}
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
    <div className="border rounded-lg bg-blue-50">
      <div className="p-3 cursor-pointer hover:bg-blue-100" onClick={handleToggleExpand}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">{expanded ? '▼' : '▶'}</span>
            <span className="font-semibold text-blue-900">{section.name}</span>
            <span className="text-sm text-blue-600">({section.area} acres)</span>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="p-3 bg-white space-y-2">
          {isLoadingBlocks ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : blocks.length === 0 ? (
            <p className="text-sm text-gray-500">No blocks</p>
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
    <div className="ml-4 border-l-2 border-purple-300 pl-3">
      <div className="p-2 bg-purple-50 rounded hover:bg-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={handleToggleExpand}>
            <span className="text-purple-600 text-xs">{expanded ? '▼' : '▶'}</span>
            <span className="font-medium text-sm text-purple-900">{block.name}</span>
            <span className="text-xs text-purple-600">• {block.cropType}</span>
          </div>

        </div>
      </div>
      {expanded && (
        <div className="mt-2 ml-4 space-y-2">
          {isLoadingBeds ? (
            <p className="text-xs text-gray-500">Loading...</p>
          ) : beds.length === 0 ? (
            <p className="text-xs text-gray-500">No beds</p>
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
    <div className="border-l-2 border-green-400 pl-3">
      <div className="p-2 bg-green-50 rounded hover:bg-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <span className="text-green-600 text-xs">{expanded ? '▼' : '▶'}</span>
            <span className="font-medium text-sm text-green-900">{bed.name}</span>
            <span className="text-xs text-green-600">{bed.length}m × {bed.width}m</span>
          </div>

        </div>
      </div>
      {expanded && (
        <div className="mt-2 ml-4 space-y-1">
          {driplines.length === 0 ? (
            <p className="text-xs text-gray-500">No drip lines</p>
          ) : (
            driplines.map(drip => (
              <div key={drip.id} className="p-2 bg-gray-50 rounded text-xs flex items-center justify-between">
                <span className="font-medium">{drip.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">{drip.flowRate} L/h</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${drip.status === 'working' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {drip.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Farms;
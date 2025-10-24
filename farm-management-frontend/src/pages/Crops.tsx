import React, { useState, useEffect } from 'react';
import { Wheat, Calendar, TrendingUp, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../config/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

interface Crop {
  id: string;
  fieldId: string;
  variety: string;
  plantingDate: Date;
  expectedHarvestDate: Date;
  status: 'planted' | 'growing' | 'harvested' | 'failed';
  yieldExpected: number;
  yieldActual?: number;
}

interface Field {
  id: string;
  name: string;
  size: number;
  location: string;
}

const Crops: React.FC = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);

  useEffect(() => {
    const unsubscribeCrops = onSnapshot(collection(db, 'crops'), (snapshot) => {
      const cropsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          fieldId: data.fieldId || '',
          variety: data.variety || '',
          plantingDate: data.plantingDate?.toDate ? data.plantingDate.toDate() : new Date(data.plantingDate),
          expectedHarvestDate: data.expectedHarvestDate?.toDate ? data.expectedHarvestDate.toDate() : new Date(data.expectedHarvestDate),
          actualHarvestDate: data.actualHarvestDate?.toDate ? data.actualHarvestDate.toDate() : data.actualHarvestDate ? new Date(data.actualHarvestDate) : undefined,
          status: data.status || 'planted',
          yieldExpected: data.yieldExpected || 0,
          yieldActual: data.yieldActual,
          notes: data.notes || ''
        } as Crop;
      });
      setCrops(cropsData);
    });

    const unsubscribeFields = onSnapshot(collection(db, 'fields'), (snapshot) => {
      const fieldsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Field[];
      setFields(fieldsData);
    });

    return () => {
      unsubscribeCrops();
      unsubscribeFields();
    };
  }, []);



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planted': return 'bg-blue-100 text-blue-800';
      case 'growing': return 'bg-green-100 text-green-800';
      case 'harvested': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCropIcon = (variety: string) => {
    const icons: { [key: string]: string } = {
      'corn': '🌽',
      'wheat': '🌾',
      'rice': '🌾',
      'soybeans': '🫘',
      'tomatoes': '🍅',
      'potatoes': '🥔'
    };
    return icons[variety.toLowerCase()] || '🌱';
  };

  const handleUpdateStatus = async (cropId: string, newStatus: 'growing' | 'harvested') => {
    try {
      await updateDoc(doc(db, 'crops', cropId), { status: newStatus });
    } catch (error) {
      console.error('Failed to update crop status:', error);
    }
  };

  const handleDeleteCrop = async (cropId: string) => {
    if (window.confirm('Delete this crop?')) {
      try {
        await deleteDoc(doc(db, 'crops', cropId));
      } catch (error) {
        console.error('Failed to delete crop:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Crop Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Crop
        </button>
      </div>

      {/* Crop Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Crops', value: crops.length, color: 'bg-blue-500' },
          { label: 'Growing', value: crops.filter(c => c.status === 'growing').length, color: 'bg-green-500' },
          { label: 'Ready to Harvest', value: crops.filter(c => c.status === 'planted' && new Date(c.expectedHarvestDate) <= new Date()).length, color: 'bg-yellow-500' },
          { label: 'Harvested', value: crops.filter(c => c.status === 'harvested').length, color: 'bg-gray-500' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className={`${stat.color} w-3 h-3 rounded-full mr-2`}></div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Crops Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harvest Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yield</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {crops.map((crop) => (
                <tr key={crop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getCropIcon(crop.variety)}</span>
                      <div className="text-sm font-medium text-gray-900">{crop.variety}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(crop.status)}`}>
                      {crop.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {crop.plantingDate ? format(crop.plantingDate, 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {crop.expectedHarvestDate ? format(crop.expectedHarvestDate, 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{crop.yieldExpected} tons</div>
                    {crop.yieldActual && <div className="text-xs text-green-600">Actual: {crop.yieldActual}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-24">
                      <div className="text-xs text-gray-600 mb-1">{crop.status === 'harvested' ? '100%' : '65%'}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${crop.status === 'harvested' ? 'bg-gray-500' : 'bg-green-500'}`} style={{ width: crop.status === 'harvested' ? '100%' : '65%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {crop.status === 'planted' && (
                        <button 
                          onClick={() => handleUpdateStatus(crop.id, 'growing')}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                        >
                          Start Growing
                        </button>
                      )}
                      {crop.status === 'growing' && (
                        <button 
                          onClick={() => handleUpdateStatus(crop.id, 'harvested')}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                        >
                          Harvest
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedCrop(crop)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCrop(crop.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete crop"
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
      </div>

      {/* Add Crop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Add New Crop</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              try {
                await addDoc(collection(db, 'crops'), {
                  variety: formData.get('variety') as string,
                  fieldId: formData.get('fieldId') as string,
                  plantingDate: new Date(formData.get('plantingDate') as string),
                  expectedHarvestDate: new Date(formData.get('expectedHarvestDate') as string),
                  yieldExpected: Number(formData.get('yieldExpected')),
                  status: 'planted',
                  createdAt: new Date()
                });
                setShowAddModal(false);
              } catch (error) {
                console.error('Failed to add crop:', error);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crop Variety</label>
                  <select
                    name="variety"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select variety</option>
                    <option value="Corn">Corn</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Rice">Rice</option>
                    <option value="Soybeans">Soybeans</option>
                    <option value="Tomatoes">Tomatoes</option>
                    <option value="Potatoes">Potatoes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
                  <select
                    name="fieldId"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select field</option>
                    {fields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.name} ({field.size} acres)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date</label>
                  <input
                    type="date"
                    name="plantingDate"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Harvest Date</label>
                  <input
                    type="date"
                    name="expectedHarvestDate"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Yield (tons)</label>
                  <input
                    type="number"
                    name="yieldExpected"
                    required
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Add Crop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Crops;
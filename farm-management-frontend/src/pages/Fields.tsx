import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Activity, Droplets, ThermometerSun } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

interface Field {
  id: string;
  name: string;
  area: number;
  coordinates: [number, number][];
  soilType: string;
  soilHealth: {
    ph: number;
    moisture: number;
    temperature: number;
    lastUpdated: Date;
  };
}

const Fields: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'fields'), (snapshot) => {
      const fieldsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Field));
      setFields(fieldsData);
    });
    return () => unsubscribe();
  }, []);

  const handleAddField = async (fieldData: Partial<Field>) => {
    try {
      await addDoc(collection(db, 'fields'), fieldData);
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add field:', error);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (window.confirm('Delete this field?')) {
      try {
        await deleteDoc(doc(db, 'fields', fieldId));
      } catch (error) {
        console.error('Failed to delete field:', error);
      }
    }
  };

  const handleEditField = async (fieldData: Partial<Field>) => {
    if (!editingField) return;
    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'fields', editingField.id), fieldData);
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update field:', error);
    }
  };

  const getSoilHealthColor = (ph: number) => {
    if (ph >= 6.0 && ph <= 7.5) return 'text-green-600';
    if (ph >= 5.5 && ph <= 8.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Field Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {fields.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No fields yet. Add your first field!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soil Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pH Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moisture</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{field.name}</div>
                      <div className="text-xs text-gray-500">ID: {field.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{field.area} acres</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {field.soilType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-semibold ${getSoilHealthColor(field.soilHealth.ph)}`}>
                          {field.soilHealth.ph}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Droplets className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-sm text-gray-900">{field.soilHealth.moisture}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ThermometerSun className="h-4 w-4 text-orange-500 mr-1" />
                        <span className="text-sm text-gray-900">{field.soilHealth.temperature}°C</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setEditingField(field)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteField(field.id)}
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

      {(showAddModal || editingField) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">{editingField ? 'Edit Field' : 'Add New Field'}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name') as string,
                area: Number(formData.get('area')),
                soilType: formData.get('soilType') as string,
              };
              if (editingField) {
                await handleEditField(data);
              } else {
                await handleAddField({
                  ...data,
                  coordinates: [],
                  soilHealth: { ph: 6.5, moisture: 45, temperature: 22, lastUpdated: new Date() }
                });
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingField?.name || ''}
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
                    defaultValue={editingField?.area || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
                  <select
                    name="soilType"
                    required
                    defaultValue={editingField?.soilType || ''}
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
                  onClick={() => { setShowAddModal(false); setEditingField(null); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingField ? 'Update' : 'Add Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fields;

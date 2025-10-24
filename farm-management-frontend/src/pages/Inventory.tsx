import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, Minus, Search, Filter } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: 'seeds' | 'fertilizers' | 'pesticides' | 'tools' | 'equipment';
  quantity: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  expiryDate?: Date;
  lowStockThreshold: number;
  fieldId?: string;
  fieldName?: string;
}

interface Field {
  id: string;
  name: string;
}

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchFields();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, categoryFilter]);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setItems([]);
    }
  };

  const fetchFields = async () => {
    try {
      const response = await fetch('/api/fields');
      if (response.ok) {
        const data = await response.json();
        setFields(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch fields:', error);
    }
  };

  const filterItems = () => {
    let filtered = items;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    setFilteredItems(filtered);
  };

  const updateQuantity = async (itemId: string, operation: 'add' | 'subtract', amount: number) => {
    try {
      const response = await fetch(`/api/inventory/${itemId}/quantity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: amount, operation })
      });
      if (response.ok) {
        fetchInventory();
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const isLowStock = (item: InventoryItem) => item.quantity <= item.lowStockThreshold;
  const isExpiringSoon = (item: InventoryItem) => {
    if (!item.expiryDate) return false;
    const daysUntilExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'seeds': '🌱',
      'fertilizers': '🧪',
      'pesticides': '🚫',
      'tools': '🔧',
      'equipment': '🚜'
    };
    return icons[category] || '📦';
  };

  const categories = ['all', 'seeds', 'fertilizers', 'pesticides', 'tools', 'equipment'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search items or suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: items.length, color: 'bg-blue-500' },
          { label: 'Low Stock', value: items.filter(isLowStock).length, color: 'bg-red-500' },
          { label: 'Expiring Soon', value: items.filter(isExpiringSoon).length, color: 'bg-yellow-500' },
          { label: 'Total Value', value: `$${items.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0).toLocaleString()}`, color: 'bg-green-500' },
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

      {/* Inventory Items */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getCategoryIcon(item.category)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.expiryDate && (
                          <div className="text-sm text-gray-500">
                            Expires: {new Date(item.expiryDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.quantity} {item.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      Min: {item.lowStockThreshold} {item.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.costPerUnit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.fieldName || 'General'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {isLowStock(item) && (
                        <span className="flex items-center text-xs text-red-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low Stock
                        </span>
                      )}
                      {isExpiringSoon(item) && (
                        <span className="flex items-center text-xs text-yellow-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expiring Soon
                        </span>
                      )}
                      {!isLowStock(item) && !isExpiringSoon(item) && (
                        <span className="text-xs text-green-600">Good</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, 'subtract', 1)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateQuantity(item.id, 'add', 1)}
                        className="p-1 text-green-600 hover:text-green-800"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add Inventory Item</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const fieldId = formData.get('fieldId') as string;
              const selectedField = fields.find(f => f.id === fieldId);
              const itemData = {
                name: formData.get('name') as string,
                category: formData.get('category') as string,
                quantity: parseInt(formData.get('quantity') as string),
                unit: formData.get('unit') as string,
                costPerUnit: parseFloat(formData.get('costPerUnit') as string),
                supplier: formData.get('supplier') as string,
                lowStockThreshold: parseInt(formData.get('lowStockThreshold') as string),
                expiryDate: formData.get('expiryDate') ? new Date(formData.get('expiryDate') as string) : undefined,
                fieldId: fieldId || undefined,
                fieldName: selectedField?.name || undefined
              };
              
              try {
                const response = await fetch('/api/inventory', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(itemData)
                });
                
                if (response.ok) {
                  setShowAddModal(false);
                  fetchInventory();
                } else {
                  console.error('Failed to add item');
                }
              } catch (error) {
                console.error('Error adding item:', error);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select category</option>
                    <option value="seeds">Seeds</option>
                    <option value="fertilizers">Fertilizers</option>
                    <option value="pesticides">Pesticides</option>
                    <option value="tools">Tools</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      type="text"
                      name="unit"
                      required
                      placeholder="kg, lbs, pcs"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit</label>
                  <input
                    type="number"
                    name="costPerUnit"
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field (Optional)</label>
                  <select
                    name="fieldId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">General Inventory</option>
                    {fields.map(field => (
                      <option key={field.id} value={field.id}>{field.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    name="expiryDate"
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
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
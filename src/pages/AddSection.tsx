import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import axios from 'axios';

const AddSection: React.FC = () => {
  const navigate = useNavigate();
  const [section, setSection] = useState({ name: '', area: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/api/sections', {
        farmId: 'default-farm',
        name: section.name,
        area: parseFloat(section.area),
        description: section.description
      });
  navigate('/farms');
    } catch (error) {
      console.error('Error adding section:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/farms')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={20} />
          Back to Farm Structure
        </button>
      </div>

      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Add New Section</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Section Name *</label>
              <input
                type="text"
                required
                value={section.name}
                onChange={(e) => setSection({...section, name: e.target.value})}
                className="w-full border rounded-lg px-4 py-3"
                placeholder="Enter section name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Area (acres) *</label>
              <input
                type="number"
                required
                step="0.1"
                min="0"
                value={section.area}
                onChange={(e) => setSection({...section, area: e.target.value})}
                className="w-full border rounded-lg px-4 py-3"
                placeholder="Enter area in acres"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={section.description}
                onChange={(e) => setSection({...section, description: e.target.value})}
                className="w-full border rounded-lg px-4 py-3 h-32"
                placeholder="Enter section description (optional)"
              />
            </div>
          </div>
          
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={() => navigate('/farms')}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !section.name || !section.area}
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSection;
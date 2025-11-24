import React from 'react';
import { MapPin, Droplets, ThermometerSun, Activity } from 'lucide-react';

interface Field {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  soilHealth: {
    ph: number;
    moisture: number;
    temperature: number;
  };
  cropType?: string;
  area: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500';
    case 'inactive': return 'bg-gray-400';
    case 'maintenance': return 'bg-yellow-500';
    default: return 'bg-gray-400';
  }
};

const getSoilHealthColor = (ph: number) => {
  if (ph >= 6.0 && ph <= 7.5) return 'text-green-600';
  if (ph >= 5.5 && ph <= 8.0) return 'text-yellow-600';
  return 'text-red-600';
};

export const FieldStatusMap: React.FC<{ fields: Field[] }> = ({ fields }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold mb-4 flex items-center">
      <MapPin className="h-5 w-5 mr-2 text-blue-600" />
      Field Status Overview
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {fields.map(field => (
        <div key={field.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">{field.name}</h4>
            <span className={`h-3 w-3 rounded-full ${getStatusColor(field.status)}`} />
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Area:</span>
              <span className="font-medium">{field.area} acres</span>
            </div>
            {field.cropType && (
              <div className="flex justify-between">
                <span className="text-gray-600">Crop:</span>
                <span className="font-medium">{field.cropType}</span>
              </div>
            )}
            
            <div className="pt-2 border-t mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600 flex items-center">
                  <Activity className="h-3 w-3 mr-1" />
                  pH:
                </span>
                <span className={`font-medium ${getSoilHealthColor(field.soilHealth.ph)}`}>
                  {field.soilHealth.ph}
                </span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600 flex items-center">
                  <Droplets className="h-3 w-3 mr-1" />
                  Moisture:
                </span>
                <span className="font-medium text-blue-600">{field.soilHealth.moisture}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <ThermometerSun className="h-3 w-3 mr-1" />
                  Temp:
                </span>
                <span className="font-medium text-orange-600">{field.soilHealth.temperature}°C</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

import React, { useState, useEffect } from 'react';
import { Users, Plus, DollarSign, Clock, Calendar } from 'lucide-react';

interface LabourRecord {
  id: string;
  workerName: string;
  workType: string;
  hoursWorked: number;
  ratePerHour: number;
  totalPay: number;
  date: Date;
  fieldId?: string;
  fieldName?: string;
  status: 'pending' | 'paid';
}

interface Field {
  id: string;
  name: string;
}

interface Worker {
  id: string;
  name: string;
  type: 'permanent' | 'casual';
  ratePerHour: number;
  phone?: string;
}

interface Attendance {
  id: string;
  workerId: string;
  workerName: string;
  workerType: string;
  fieldId?: string;
  fieldName?: string;
  checkInTime: Date;
  checkOutTime?: Date;
  hoursWorked?: number;
  status: 'checked_in' | 'checked_out';
}

const Labour: React.FC = () => {
  const [records, setRecords] = useState<LabourRecord[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [activeCheckins, setActiveCheckins] = useState<Attendance[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'records' | 'attendance' | 'workers'>('attendance');

  useEffect(() => {
    fetchLabourRecords();
    fetchFields();
    fetchWorkers();
    fetchActiveCheckins();
  }, []);

  const fetchLabourRecords = async () => {
    try {
      const response = await fetch('/api/labour');
      if (response.ok) {
        const data = await response.json();
        setRecords(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch labour records:', error);
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

  const fetchWorkers = async () => {
    try {
      const response = await fetch('/api/labour/workers');
      if (response.ok) {
        const data = await response.json();
        setWorkers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    }
  };

  const fetchActiveCheckins = async () => {
    try {
      const response = await fetch('/api/labour/active-checkins');
      if (response.ok) {
        const data = await response.json();
        setActiveCheckins(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch active check-ins:', error);
    }
  };

  const checkOut = async (attendanceId: string) => {
    try {
      const response = await fetch(`/api/labour/checkout/${attendanceId}`, {
        method: 'PUT'
      });
      if (response.ok) {
        fetchActiveCheckins();
      }
    } catch (error) {
      console.error('Failed to check out:', error);
    }
  };

  const totalPending = records.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.totalPay, 0);
  const totalPaid = records.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.totalPay, 0);
  const totalHours = records.reduce((sum, r) => sum + r.hoursWorked, 0);

  const markAsPaid = async (id: string) => {
    try {
      const response = await fetch(`/api/labour/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' })
      });
      if (response.ok) {
        fetchLabourRecords();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Labour Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCheckinModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Clock className="h-4 w-4 mr-2" />
            Check In/Out
          </button>
          <button
            onClick={() => setShowWorkerModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Users className="h-4 w-4 mr-2" />
            Add Worker
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'attendance'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'records'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Labour Records
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'workers'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Workers
          </button>
        </nav>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-xl shadow-green-400 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Workers</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(records.map(r => r.workerName)).size}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl shadow-green-400 p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{totalHours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl shadow-green-400 p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payment</p>
              <p className="text-2xl font-bold text-yellow-600">${totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl shadow-green-400 p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Check-ins */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Check-ins</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeCheckins.map((checkin) => {
                  const checkInTime = checkin.checkInTime instanceof Date ? checkin.checkInTime : 
                                     (checkin.checkInTime as any).toDate ? (checkin.checkInTime as any).toDate() : 
                                     new Date(checkin.checkInTime);
                  const duration = ((new Date().getTime() - checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(1);
                  return (
                    <tr key={checkin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{checkin.workerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          checkin.workerType === 'permanent' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {checkin.workerType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{checkin.fieldName || 'General'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{checkInTime.toLocaleTimeString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{duration}h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => checkOut(checkin.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Check Out
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Workers List */}
      {activeTab === 'workers' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Workers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate/Hour</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{worker.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        worker.type === 'permanent' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {worker.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${worker.ratePerHour}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{worker.phone || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Labour Records Table */}
      {activeTab === 'records' && (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Labour Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate/Hour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pay</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => {
                const date = record.date instanceof Date ? record.date : 
                             (record.date as any).toDate ? (record.date as any).toDate() : 
                             new Date(record.date);
                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.workerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.workType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.fieldName || 'General'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{date.toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.hoursWorked}h</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.ratePerHour}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${record.totalPay.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        record.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.status === 'pending' && (
                        <button
                          onClick={() => markAsPaid(record.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Add Labour Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add Labour Record</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const hoursWorked = parseFloat(formData.get('hoursWorked') as string);
              const ratePerHour = parseFloat(formData.get('ratePerHour') as string);
              const fieldId = formData.get('fieldId') as string;
              const selectedField = fields.find(f => f.id === fieldId);
              
              const recordData = {
                workerName: formData.get('workerName') as string,
                workType: formData.get('workType') as string,
                hoursWorked,
                ratePerHour,
                totalPay: hoursWorked * ratePerHour,
                date: new Date(formData.get('date') as string),
                fieldId: fieldId || undefined,
                fieldName: selectedField?.name || undefined,
                status: 'pending'
              };
              
              try {
                const response = await fetch('/api/labour', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(recordData)
                });
                
                if (response.ok) {
                  setShowAddModal(false);
                  fetchLabourRecords();
                }
              } catch (error) {
                console.error('Error adding labour record:', error);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
                  <input
                    type="text"
                    name="workerName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                  <select
                    name="workType"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select work type</option>
                    <option value="Planting">Planting</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Irrigation">Irrigation</option>
                    <option value="Weeding">Weeding</option>
                    <option value="Fertilizing">Fertilizing</option>
                    <option value="General Maintenance">General Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
                  <select
                    name="fieldId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">General (Not field-specific)</option>
                    {fields.map(field => (
                      <option key={field.id} value={field.id}>{field.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
                    <input
                      type="number"
                      name="hoursWorked"
                      required
                      step="0.5"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate/Hour ($)</label>
                    <input
                      type="number"
                      name="ratePerHour"
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
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
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      {showWorkerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add Worker</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const workerData = {
                name: formData.get('name') as string,
                type: formData.get('type') as string,
                ratePerHour: parseFloat(formData.get('ratePerHour') as string),
                phone: formData.get('phone') as string
              };
              
              try {
                const response = await fetch('/api/labour/workers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(workerData)
                });
                
                if (response.ok) {
                  setShowWorkerModal(false);
                  fetchWorkers();
                }
              } catch (error) {
                console.error('Error adding worker:', error);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Worker Type</label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="permanent">Permanent</option>
                    <option value="casual">Casual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Hour ($)</label>
                  <input
                    type="number"
                    name="ratePerHour"
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowWorkerModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Add Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      {showCheckinModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Worker Check-in</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const workerId = formData.get('workerId') as string;
              const selectedWorker = workers.find(w => w.id === workerId);
              const fieldId = formData.get('fieldId') as string;
              const selectedField = fields.find(f => f.id === fieldId);
              
              const checkinData = {
                workerId,
                workerName: selectedWorker?.name,
                workerType: selectedWorker?.type,
                fieldId: fieldId || undefined,
                fieldName: selectedField?.name || undefined
              };
              
              try {
                const response = await fetch('/api/labour/checkin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(checkinData)
                });
                
                if (response.ok) {
                  setShowCheckinModal(false);
                  fetchActiveCheckins();
                }
              } catch (error) {
                console.error('Error checking in:', error);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Worker</label>
                  <select
                    name="workerId"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Choose a worker</option>
                    {workers.map(worker => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} ({worker.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field (Optional)</label>
                  <select
                    name="fieldId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">General</option>
                    {fields.map(field => (
                      <option key={field.id} value={field.id}>{field.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Check In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Labour;

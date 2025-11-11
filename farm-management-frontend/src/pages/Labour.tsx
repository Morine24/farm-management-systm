import React, { useState, useEffect } from 'react';
import { Users, Plus, DollarSign, Clock, Calendar, TrendingUp, Briefcase, Edit2, Trash2, Phone } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LabourRecord {
  id: string;
  workerName: string;
  workType: string;
  hoursWorked: number;
  ratePerHour: number;
  totalPay: number;
  date: Date;
  farmId?: string;
  farmName?: string;
  status: 'pending' | 'paid';
}

interface Farm {
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
  farmId?: string;
  farmName?: string;
  checkInTime: Date;
  checkOutTime?: Date;
  hoursWorked?: number;
  status: 'checked_in' | 'checked_out';
}

interface Contract {
  id: string;
  date: string;
  project: string;
  inCharge: string;
  contact: string;
  employees: string;
  cost?: number;
}

interface WorkPlan {
  id: string;
  date: string;
  activity: string;
  labourRequired: string;
}

const Labour: React.FC = () => {
  const [records, setRecords] = useState<LabourRecord[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeCheckins, setActiveCheckins] = useState<Attendance[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'attendance' | 'records' | 'workers' | 'scheduler' | 'contracts'>('attendance');
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [timeIn, setTimeIn] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [ratePerHour, setRatePerHour] = useState(0);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showContractForm, setShowContractForm] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [contractForm, setContractForm] = useState({ date: '', project: '', inCharge: '', contact: '', employees: '', cost: '' });
  const [workPlans, setWorkPlans] = useState<WorkPlan[]>([]);
  const [showWorkPlanForm, setShowWorkPlanForm] = useState(false);
  const [editingWorkPlanId, setEditingWorkPlanId] = useState<string | null>(null);
  const [workPlanForm, setWorkPlanForm] = useState({ date: '', activity: '', labourRequired: '' });
  const [schedulerView, setSchedulerView] = useState<'tasks' | 'workplans'>('tasks');

  useEffect(() => {
    fetchLabourRecords();
    fetchFarms();
    fetchWorkers();
    fetchUsers();
    fetchActiveCheckins();
    fetchContracts();
    fetchWorkPlans();
    
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate() || new Date()
      }));
      setTasks(tasksData);
    });

    return () => unsubscribeTasks();
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

  const fetchFarms = async () => {
    try {
      const response = await fetch('/api/farms');
      if (response.ok) {
        const data = await response.json();
        setFarms(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch farms:', error);
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

  const fetchUsers = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      const snapshot = await getDocs(collection(db, 'users'));
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
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

  const fetchContracts = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/contracts');
      const data = await response.json();
      setContracts(data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingContractId 
        ? `http://localhost:5001/api/contracts/${editingContractId}`
        : 'http://localhost:5001/api/contracts';
      const method = editingContractId ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractForm)
      });
      
      fetchContracts();
      setContractForm({ date: '', project: '', inCharge: '', contact: '', employees: '', cost: '' });
      setEditingContractId(null);
      setShowContractForm(false);
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  const handleEditContract = (contract: Contract) => {
    setContractForm({
      date: contract.date,
      project: contract.project,
      inCharge: contract.inCharge,
      contact: contract.contact,
      employees: contract.employees,
      cost: contract.cost?.toString() || ''
    });
    setEditingContractId(contract.id);
    setShowContractForm(true);
  };

  const handleDeleteContract = async (id: string) => {
    if (!window.confirm('Delete this contract?')) return;
    try {
      await fetch(`http://localhost:5001/api/contracts/${id}`, { method: 'DELETE' });
      fetchContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
    }
  };

  const fetchWorkPlans = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/workplans');
      const data = await response.json();
      setWorkPlans(data);
    } catch (error) {
      console.error('Error fetching work plans:', error);
    }
  };

  const handleWorkPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingWorkPlanId 
        ? `http://localhost:5001/api/workplans/${editingWorkPlanId}`
        : 'http://localhost:5001/api/workplans';
      const method = editingWorkPlanId ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workPlanForm)
      });
      
      fetchWorkPlans();
      setWorkPlanForm({ date: '', activity: '', labourRequired: '' });
      setEditingWorkPlanId(null);
      setShowWorkPlanForm(false);
    } catch (error) {
      console.error('Error saving work plan:', error);
    }
  };

  const handleEditWorkPlan = (plan: WorkPlan) => {
    setWorkPlanForm({ date: plan.date, activity: plan.activity, labourRequired: plan.labourRequired });
    setEditingWorkPlanId(plan.id);
    setShowWorkPlanForm(true);
  };

  const handleDeleteWorkPlan = async (id: string) => {
    if (!window.confirm('Delete this work plan?')) return;
    try {
      await fetch(`http://localhost:5001/api/workplans/${id}`, { method: 'DELETE' });
      fetchWorkPlans();
    } catch (error) {
      console.error('Error deleting work plan:', error);
    }
  };

  const checkOut = async (attendanceId: string) => {
    try {
      const response = await fetch(`/api/labour/checkout/${attendanceId}`, {
        method: 'PUT'
      });
      if (response.ok) {
        fetchActiveCheckins();
        fetchLabourRecords();
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
      const { updateDoc, doc, addDoc, collection } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      
      const record = records.find(r => r.id === id);
      if (!record) return;
      
      await updateDoc(doc(db, 'labour', id), { status: 'paid' });
      
      // Auto-create financial expense record
      await addDoc(collection(db, 'transactions'), {
        type: 'expense',
        category: 'Labour Cost',
        amount: record.totalPay,
        description: `${record.workerName} - ${record.workType} (${record.hoursWorked}h)`,
        date: new Date(),
        farmId: record.farmId || null,
        farmName: record.farmName || 'General'
      });
      
      fetchLabourRecords();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Labour Management</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowCheckinModal(true)}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
          >
            <Clock className="h-4 w-4 mr-2" />
            Check In/Out
          </button>
          <button
            onClick={() => setShowWorkerModal(true)}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            <Users className="h-4 w-4 mr-2" />
            Add Worker
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-4 md:space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
              activeTab === 'records'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Records
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
              activeTab === 'workers'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Workers
          </button>
          <button
            onClick={() => setActiveTab('scheduler')}
            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
              activeTab === 'scheduler'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scheduler
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
              activeTab === 'contracts'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Contracts
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
              <p className="text-2xl font-bold text-yellow-600">KSh {totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl shadow-green-400 p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">KSh {totalPaid.toLocaleString()}</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{checkin.farmName || 'General'}</td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">KSh {worker.ratePerHour}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{worker.phone || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Scheduler */}
      {activeTab === 'scheduler' && (() => {
        const weekStart = new Date(selectedWeek);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekTasks = tasks.filter(task => {
          const taskDate = new Date(task.dueDate);
          return taskDate >= weekStart && taskDate < weekEnd;
        });

        const totalEstimatedCost = weekTasks.reduce((sum, t) => sum + (t.labourCost || 0), 0);
        const totalEstimatedHours = weekTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
        const completedTasks = weekTasks.filter(t => t.status === 'completed');
        const totalActualCost = completedTasks.reduce((sum, t) => sum + (t.actualCost || 0), 0);

        const workerSchedule = workers.map(worker => {
          const workerTasks = weekTasks.filter(t => t.assignedTo === worker.name);
          const totalHours = workerTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
          const totalCost = workerTasks.reduce((sum, t) => sum + (t.labourCost || 0), 0);
          return { worker, tasks: workerTasks, totalHours, totalCost };
        });

        return (
          <>
            <div className="mb-4 border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setSchedulerView('tasks')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    schedulerView === 'tasks'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Task Schedule
                </button>
                <button
                  onClick={() => setSchedulerView('workplans')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    schedulerView === 'workplans'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Work Plans
                </button>
              </nav>
            </div>

            {schedulerView === 'workplans' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowWorkPlanForm(!showWorkPlanForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-5 h-5" />
                    Add Work Plan
                  </button>
                </div>

                {showWorkPlanForm && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">{editingWorkPlanId ? 'Edit' : 'New'} Work Plan</h2>
                    <form onSubmit={handleWorkPlanSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={workPlanForm.date}
                          onChange={(e) => setWorkPlanForm({ ...workPlanForm, date: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
                        <textarea
                          value={workPlanForm.activity}
                          onChange={(e) => setWorkPlanForm({ ...workPlanForm, activity: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="e.g., Weeding newly onion area having beans and Charles farm"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Labour Required</label>
                        <input
                          type="text"
                          value={workPlanForm.labourRequired}
                          onChange={(e) => setWorkPlanForm({ ...workPlanForm, labourRequired: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 4 women, no external labour needed"
                          required
                        />
                      </div>
                      <div className="md:col-span-2 flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          {editingWorkPlanId ? 'Update' : 'Create'} Work Plan
                        </button>
                        <button type="button" onClick={() => { setShowWorkPlanForm(false); setEditingWorkPlanId(null); setWorkPlanForm({ date: '', activity: '', labourRequired: '' }); }} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Activity</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Labour Required</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {workPlans.map((plan) => (
                          <tr key={plan.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{new Date(plan.date).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{plan.activity}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {plan.labourRequired}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditWorkPlan(plan)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteWorkPlan(plan.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {workPlans.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No work plans found. Add your first work plan to get started.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {schedulerView === 'tasks' && (
            <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Weekly Task Schedule</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    const newDate = new Date(selectedWeek);
                    newDate.setDate(newDate.getDate() - 7);
                    setSelectedWeek(newDate);
                  }}
                  className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  ← Previous
                </button>
                <span className="font-medium">{selectedWeek.toLocaleDateString()}</span>
                <button
                  onClick={() => {
                    const newDate = new Date(selectedWeek);
                    newDate.setDate(newDate.getDate() + 7);
                    setSelectedWeek(newDate);
                  }}
                  className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Next →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                <p className="text-sm text-gray-600">Scheduled Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{weekTasks.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <Clock className="h-8 w-8 text-green-600 mb-2" />
                <p className="text-sm text-gray-600">Est. Hours</p>
                <p className="text-2xl font-bold text-gray-900">{totalEstimatedHours.toFixed(1)}h</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <DollarSign className="h-8 w-8 text-yellow-600 mb-2" />
                <p className="text-sm text-gray-600">Est. Cost</p>
                <p className="text-2xl font-bold text-gray-900">KSh {totalEstimatedCost.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
                <p className="text-sm text-gray-600">Actual Cost</p>
                <p className="text-2xl font-bold text-gray-900">KSh {totalActualCost.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Worker Schedule & Costs</h3>
              <div className="space-y-4">
                {workerSchedule.map(({ worker, tasks: workerTasks, totalHours, totalCost }) => (
                  <div key={worker.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{worker.name}</h4>
                        <p className="text-sm text-gray-600">{worker.type} • KSh {worker.ratePerHour}/hour</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total: <span className="font-medium">{totalHours.toFixed(1)}h</span></p>
                        <p className="text-sm text-gray-600">Cost: <span className="font-medium text-green-600">KSh {totalCost.toFixed(2)}</span></p>
                      </div>
                    </div>
                    {workerTasks.length > 0 ? (
                      <div className="space-y-2">
                        {workerTasks.map(task => (
                          <div key={task.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{task.type}</p>
                              <p className="text-xs text-gray-600">{task.farmName} • {new Date(task.dueDate).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-900">{task.estimatedHours}h</p>
                              <p className="text-xs text-gray-600">KSh {(task.labourCost || 0).toFixed(2)}</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {task.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-2">No tasks scheduled</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            </>
            )}
          </>
        );
      })()}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowContractForm(!showContractForm)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-5 h-5" />
              Add Contract
            </button>
          </div>

          {showContractForm && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">{editingContractId ? 'Edit' : 'New'} Contract</h2>
              <form onSubmit={handleContractSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={contractForm.date}
                    onChange={(e) => setContractForm({ ...contractForm, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project/Activity</label>
                  <input
                    type="text"
                    value={contractForm.project}
                    onChange={(e) => setContractForm({ ...contractForm, project: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">In-charge Person</label>
                  <input
                    type="text"
                    value={contractForm.inCharge}
                    onChange={(e) => setContractForm({ ...contractForm, inCharge: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={contractForm.contact}
                    onChange={(e) => setContractForm({ ...contractForm, contact: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employees Reported for Work</label>
                  <textarea
                    value={contractForm.employees}
                    onChange={(e) => setContractForm({ ...contractForm, employees: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Enter employee names separated by commas"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (KSh)</label>
                  <input
                    type="number"
                    value={contractForm.cost}
                    onChange={(e) => setContractForm({ ...contractForm, cost: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter total cost"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    {editingContractId ? 'Update' : 'Create'} Contract
                  </button>
                  <button type="button" onClick={() => { setShowContractForm(false); setEditingContractId(null); setContractForm({ date: '', project: '', inCharge: '', contact: '', employees: '', cost: '' }); }} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Project/Activity</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">In-charge Person</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Employees</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cost</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{new Date(contract.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{contract.project}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{contract.inCharge}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {contract.contact}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className="truncate max-w-xs" title={contract.employees}>
                            {contract.employees}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {contract.cost ? `KSh ${contract.cost.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditContract(contract)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContract(contract.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contracts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No contracts found. Add your first contract to get started.
                </div>
              )}
            </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.farmName || 'General'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{date.toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.hoursWorked}h</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">KSh {record.ratePerHour}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">KSh {record.totalPay.toLocaleString()}</td>
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
      {showAddModal && (() => {
        const calculateAmountPayable = () => {
          if (!timeIn || !timeOut || !ratePerHour) return 0;
          const [inHour, inMin] = timeIn.split(':').map(Number);
          const [outHour, outMin] = timeOut.split(':').map(Number);
          const hoursWorked = ((outHour * 60 + outMin) - (inHour * 60 + inMin)) / 60;
          return hoursWorked * ratePerHour;
        };
        
        const amountPayable = calculateAmountPayable();
        
        return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add Labour Record</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const timeInValue = formData.get('timeIn') as string;
              const timeOutValue = formData.get('timeOut') as string;
              const [inHour, inMin] = timeInValue.split(':').map(Number);
              const [outHour, outMin] = timeOutValue.split(':').map(Number);
              const hoursWorked = ((outHour * 60 + outMin) - (inHour * 60 + inMin)) / 60;
              const ratePerHourValue = parseFloat(formData.get('ratePerHour') as string);
              const farmId = formData.get('farmId') as string;
              const selectedFarm = farms.find(f => f.id === farmId);
              
              const recordData = {
                workerName: formData.get('workerName') as string,
                workType: formData.get('workType') as string,
                timeIn: timeInValue,
                timeOut: timeOutValue,
                hoursWorked,
                ratePerHour: ratePerHourValue,
                totalPay: hoursWorked * ratePerHourValue,
                frequency: formData.get('frequency') as string,
                remarks: formData.get('remarks') as string,
                date: new Date(formData.get('date') as string),
                farmId: farmId || undefined,
                farmName: selectedFarm?.name || undefined,
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
                  setTimeIn('');
                  setTimeOut('');
                  setRatePerHour(0);
                  fetchLabourRecords();
                }
              } catch (error) {
                console.error('Error adding labour record:', error);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
                  <select
                    name="workerName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select worker</option>
                    {workers.map(worker => (
                      <option key={worker.id} value={worker.name}>{worker.name}</option>
                    ))}
                    {users.map(user => (
                      <option key={user.id} value={user.name}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
                  <input
                    type="text"
                    name="workType"
                    required
                    placeholder="e.g., feeding, washing, spraying"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
                  <select
                    name="farmId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">General (Not farm-specific)</option>
                    {farms.map(farm => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time In</label>
                    <input
                      type="time"
                      name="timeIn"
                      required
                      value={timeIn}
                      onChange={(e) => setTimeIn(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Out</label>
                    <input
                      type="time"
                      name="timeOut"
                      required
                      value={timeOut}
                      onChange={(e) => setTimeOut(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    name="frequency"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Once">Once</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <select
                    name="remarks"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Done">Done</option>
                    <option value="Not Done">Not Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate/Hour (KSh)</label>
                  <input
                    type="number"
                    name="ratePerHour"
                    required
                    step="0.01"
                    min="0"
                    value={ratePerHour || ''}
                    onChange={(e) => setRatePerHour(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Payable (KSh)</label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-semibold">
                    KSh {amountPayable.toFixed(2)}
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
        );
      })()}

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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Hour (KSh)</label>
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
              const farmId = formData.get('farmId') as string;
              const selectedFarm = farms.find(f => f.id === farmId);
              
              const checkinData = {
                workerId,
                workerName: selectedWorker?.name,
                workerType: selectedWorker?.type,
                farmId: farmId || undefined,
                farmName: selectedFarm?.name || undefined
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm (Optional)</label>
                  <select
                    name="farmId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">General</option>
                    {farms.map(farm => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
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

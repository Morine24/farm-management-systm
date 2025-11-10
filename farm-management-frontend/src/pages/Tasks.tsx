import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, AlertCircle, CheckCircle, Plus, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Task {
  id: string;
  fieldId: string;
  title: string;
  description: string;
  type: string;
  assignedTo: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  assignedWorker?: string;
  assignedWorkerName?: string;
  estimatedHours?: number;
  hourlyRate?: number;
  labourCost?: number;
  actualHours?: number;
  actualCost?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({
    farmId: '',
    farmName: '',
    type: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    estimatedHours: 0,
    hourlyRate: 0
  });
  const [workers, setWorkers] = useState<any[]>([]);
  const [showLabourModal, setShowLabourModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completionData, setCompletionData] = useState({ actualHours: 0, actualCost: 0 });

  useEffect(() => {
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate() || new Date()
      })) as Task[];
      setTasks(tasksData);
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData.filter(user => user.status === 'active'));
    });

    const unsubscribeFarms = onSnapshot(collection(db, 'farms'), (snapshot) => {
      const farmsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFarms(farmsData);
    });

    fetchWorkers();

    return () => {
      unsubscribeTasks();
      unsubscribeUsers();
      unsubscribeFarms();
    };
  }, []);

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

  useEffect(() => {
    filterTasks();
  }, [tasks, filter]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const labourCost = newTask.estimatedHours * newTask.hourlyRate;
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        dueDate: new Date(newTask.dueDate),
        status: 'pending',
        labourCost,
        actualHours: 0,
        actualCost: 0,
        createdAt: new Date()
      });
      setNewTask({ farmId: '', farmName: '', type: '', assignedTo: '', dueDate: '', priority: 'medium', estimatedHours: 0, hourlyRate: 0 });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;
    if (filter !== 'all') {
      filtered = tasks.filter(task => task.status === filter);
    }
    setFilteredTasks(filtered);
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      if (status === 'completed') {
        const task = tasks.find(t => t.id === taskId);
        setSelectedTask(task || null);
        setCompletionData({ actualHours: task?.estimatedHours || 0, actualCost: task?.labourCost || 0 });
        setShowLabourModal(true);
      } else {
        await updateDoc(doc(db, 'tasks', taskId), { status });
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const completeTask = async () => {
    if (!selectedTask) return;
    try {
      const { updateDoc, doc, addDoc, collection } = await import('firebase/firestore');
      
      // Update task status
      await updateDoc(doc(db, 'tasks', selectedTask.id), { 
        status: 'completed',
        actualHours: completionData.actualHours,
        actualCost: completionData.actualCost,
        completedDate: new Date(),
        isPaid: false
      });
      
      // Add labour cost to financial records
      await addDoc(collection(db, 'financial'), {
        type: 'expense',
        category: 'Labor',
        amount: completionData.actualCost,
        description: `Labour cost for ${selectedTask.type} - ${selectedTask.assignedTo}`,
        date: new Date(),
        fieldId: undefined,
        fieldName: undefined,
        taskId: selectedTask.id,
        isPaid: true
      });
      
      setShowLabourModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'irrigating': return '💧';
      case 'fertilizing': return '🌱';
      case 'harvesting': return '🌾';
      case 'plowing': return '🚜';
      default: return '📋';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Task Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 w-full sm:w-auto whitespace-nowrap"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'in_progress', 'completed', 'overdue'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === status
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: tasks.length, color: 'bg-blue-500' },
          { label: 'Pending', value: tasks.filter(t => t.status === 'pending').length, color: 'bg-yellow-500' },
          { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: 'bg-blue-500' },
          { label: 'Overdue', value: tasks.filter(t => t.status === 'overdue').length, color: 'bg-red-500' },
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

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Task</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Assigned</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Due Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Est. Hours</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Labour Cost</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Priority</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-xl sm:text-2xl mr-1 sm:mr-2">{getTaskIcon(task.type)}</span>
                      <div className="font-medium text-gray-900 text-xs sm:text-sm">{task.type}</div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm text-gray-900 truncate max-w-[80px] sm:max-w-none">{task.assignedTo}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <span className="text-sm text-gray-900">{task.estimatedHours || 0}h</span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <span className="text-sm font-medium text-gray-900">${(task.labourCost || 0).toFixed(2)}</span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <span className={`text-xs sm:text-sm font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs sm:text-sm"
                      >
                        Start
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                        className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs sm:text-sm"
                      >
                        Done
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No tasks found</p>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
            <form onSubmit={handleAddTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
                  <select
                    value={newTask.farmId}
                    onChange={(e) => {
                      const farm = farms.find(f => f.id === e.target.value);
                      setNewTask({ ...newTask, farmId: e.target.value, farmName: farm?.name || '' });
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select farm</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>
                        {farm.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select type</option>
                    <option value="plowing">Plowing</option>
                    <option value="sowing">Sowing</option>
                    <option value="irrigating">Irrigating</option>
                    <option value="fertilizing">Fertilizing</option>
                    <option value="pest_control">Pest Control</option>
                    <option value="harvesting">Harvesting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <select
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.name}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                    <input
                      type="number"
                      value={newTask.estimatedHours}
                      onChange={(e) => setNewTask({ ...newTask, estimatedHours: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                    <input
                      type="number"
                      value={newTask.hourlyRate}
                      onChange={(e) => setNewTask({ ...newTask, hourlyRate: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                {newTask.estimatedHours > 0 && newTask.hourlyRate > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      Estimated Labour Cost: <span className="font-bold text-blue-600">${(newTask.estimatedHours * newTask.hourlyRate).toFixed(2)}</span>
                    </p>
                  </div>
                )}
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
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Task with Labour Cost Modal */}
      {showLabourModal && selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Complete Task - Labour Details</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Task: <span className="font-medium text-gray-900">{selectedTask.type}</span></p>
                <p className="text-sm text-gray-600">Estimated: <span className="font-medium">{selectedTask.estimatedHours}h @ ${selectedTask.hourlyRate}/h = ${selectedTask.labourCost?.toFixed(2)}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Hours Worked</label>
                <input
                  type="number"
                  value={completionData.actualHours}
                  onChange={(e) => {
                    const hours = parseFloat(e.target.value) || 0;
                    setCompletionData({ 
                      actualHours: hours, 
                      actualCost: hours * (selectedTask.hourlyRate || 0) 
                    });
                  }}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Labour Cost ($)</label>
                <input
                  type="number"
                  value={completionData.actualCost}
                  onChange={(e) => setCompletionData({ ...completionData, actualCost: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  Variance: <span className={`font-bold ${(completionData.actualCost - (selectedTask.labourCost || 0)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${Math.abs(completionData.actualCost - (selectedTask.labourCost || 0)).toFixed(2)} 
                    {(completionData.actualCost - (selectedTask.labourCost || 0)) > 0 ? ' over' : ' under'} budget
                  </span>
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowLabourModal(false);
                  setSelectedTask(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={completeTask}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Complete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
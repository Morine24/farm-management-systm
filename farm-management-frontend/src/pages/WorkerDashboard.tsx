import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useUser } from '../contexts/UserContext';
import { CheckSquare, Clock, AlertCircle, Wheat, Beef } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  assignedTo: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
}

const WorkerDashboard: React.FC = () => {
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'crops' | 'livestock'>('tasks');
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tasks'),
      where('assignedTo', '==', user.name)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate() || new Date()
      })) as Task[];
      setMyTasks(tasksData);
    });

    const unsubCrops = onSnapshot(collection(db, 'crops'), (snapshot) => {
      setCrops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAnimals = onSnapshot(collection(db, 'animals'), (snapshot) => {
      setAnimals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubCrops();
      unsubAnimals();
    };
  }, [user]);

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'tasks', taskId), { status });
    } catch (error) {
      console.error('Failed to update task:', error);
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

  const pendingTasks = myTasks.filter(t => t.status === 'pending');
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress');
  const completedTasks = myTasks.filter(t => t.status === 'completed');

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentAttendanceId, setCurrentAttendanceId] = useState<string | null>(null);

  useEffect(() => {
    checkAttendanceStatus();
  }, [user]);

  const checkAttendanceStatus = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/labour/active-checkins');
      if (response.ok) {
        const data = await response.json();
        const myCheckin = data.find((c: any) => c.workerName === user.name);
        if (myCheckin) {
          setIsCheckedIn(true);
          setCurrentAttendanceId(myCheckin.id);
        }
      }
    } catch (error) {
      console.error('Failed to check attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/labour/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: user.id || user.name,
          workerName: user.name,
          workerType: 'permanent'
        })
      });
      if (response.ok) {
        const data = await response.json();
        setIsCheckedIn(true);
        setCurrentAttendanceId(data.id);
      }
    } catch (error) {
      console.error('Failed to check in:', error);
    }
  };

  const handleCheckOut = async () => {
    if (!currentAttendanceId) return;
    try {
      const response = await fetch(`/api/labour/checkout/${currentAttendanceId}`, {
        method: 'PUT'
      });
      if (response.ok) {
        setIsCheckedIn(false);
        setCurrentAttendanceId(null);
      }
    } catch (error) {
      console.error('Failed to check out:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <div>
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg"
            >
              <Clock className="h-5 w-5 mr-2" />
              Check In
            </button>
          ) : (
            <button
              onClick={handleCheckOut}
              className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg"
            >
              <Clock className="h-5 w-5 mr-2" />
              Check Out
            </button>
          )}
        </div>
      </div>

      {/* Attendance Status Card */}
      {isCheckedIn && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800 font-medium">You are currently checked in</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('tasks')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'tasks' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Tasks
          </button>
          <button onClick={() => setActiveTab('crops')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'crops' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Crops
          </button>
          <button onClick={() => setActiveTab('livestock')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'livestock' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Livestock
          </button>
        </nav>
      </div>

      {activeTab === 'tasks' && (
      <>
      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-xl shadow-green-400 p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl shadow-green-400 p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgressTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl shadow-green-400 p-6">
          <div className="flex items-center">
            <CheckSquare className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Tasks */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">My Assigned Tasks</h2>
        </div>
        <div className="overflow-x-auto">
          {myTasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tasks assigned to you yet.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{task.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.dueDate.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Start
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Complete
                        </button>
                      )}
                      {task.status === 'completed' && (
                        <span className="text-green-600">✓ Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </>
      )}

      {activeTab === 'crops' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Crops Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Crops</p>
              <p className="text-2xl font-bold text-blue-600">{crops.length}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Growing</p>
              <p className="text-2xl font-bold text-green-600">{crops.filter(c => c.status === 'growing').length}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Planted</p>
              <p className="text-2xl font-bold text-yellow-600">{crops.filter(c => c.status === 'planted').length}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Harvested</p>
              <p className="text-2xl font-bold text-purple-600">{crops.filter(c => c.status === 'harvested').length}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planting Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Yield</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {crops.map(crop => (
                  <tr key={crop.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{crop.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{crop.fieldName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(crop.plantingDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{crop.expectedYield || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        crop.status === 'harvested' ? 'bg-green-100 text-green-800' :
                        crop.status === 'growing' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {crop.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'livestock' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Livestock & Poultry Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Animals</p>
              <p className="text-2xl font-bold text-blue-600">{animals.length}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Healthy</p>
              <p className="text-2xl font-bold text-green-600">{animals.filter(a => a.healthStatus === 'healthy').length}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Sick</p>
              <p className="text-2xl font-bold text-red-600">{animals.filter(a => a.healthStatus === 'sick').length}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Quarantine</p>
              <p className="text-2xl font-bold text-yellow-600">{animals.filter(a => a.healthStatus === 'quarantine').length}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {animals.map(animal => (
                  <tr key={animal.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{animal.tagId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{animal.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{animal.breed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{animal.age} months</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{animal.weight} kg</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        animal.healthStatus === 'healthy' ? 'bg-green-100 text-green-800' :
                        animal.healthStatus === 'sick' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {animal.healthStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{animal.farmName || 'General'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
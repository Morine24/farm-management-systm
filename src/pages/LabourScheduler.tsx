import React, { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Task {
  id: string;
  type: string;
  farmName: string;
  assignedTo: string;
  dueDate: Date;
  status: string;
  estimatedHours: number;
  hourlyRate: number;
  labourCost: number;
  actualHours?: number;
  actualCost?: number;
}

interface Worker {
  id: string;
  name: string;
  type: string;
  ratePerHour: number;
}

const LabourScheduler: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  useEffect(() => {
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate() || new Date()
      })) as Task[];
      setTasks(tasksData);
    });

    fetchWorkers();

    return () => unsubscribeTasks();
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

  const getWeekTasks = () => {
    const weekStart = new Date(selectedWeek);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate >= weekStart && taskDate < weekEnd;
    });
  };

  const weekTasks = getWeekTasks();
  const totalEstimatedCost = weekTasks.reduce((sum, t) => sum + (t.labourCost || 0), 0);
  const totalEstimatedHours = weekTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const completedTasks = weekTasks.filter(t => t.status === 'completed');
  const totalActualCost = completedTasks.reduce((sum, t) => sum + (t.actualCost || 0), 0);
  const totalActualHours = completedTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

  const workerSchedule = workers.map(worker => {
    const workerTasks = weekTasks.filter(t => t.assignedTo === worker.name);
    const totalHours = workerTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalCost = workerTasks.reduce((sum, t) => sum + (t.labourCost || 0), 0);
    return { worker, tasks: workerTasks, totalHours, totalCost };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Labour Task Scheduler</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              const newDate = new Date(selectedWeek);
              newDate.setDate(newDate.getDate() - 7);
              setSelectedWeek(newDate);
            }}
            className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← Previous Week
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
            Next Week →
          </button>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Scheduled Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{weekTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Est. Hours</p>
              <p className="text-2xl font-bold text-gray-900">{totalEstimatedHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Est. Cost</p>
              <p className="text-2xl font-bold text-gray-900">${totalEstimatedCost.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Actual Cost</p>
              <p className="text-2xl font-bold text-gray-900">${totalActualCost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Worker Schedule */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Worker Schedule & Costs</h2>
        </div>
        <div className="p-6 space-y-4">
          {workerSchedule.map(({ worker, tasks, totalHours, totalCost }) => (
            <div key={worker.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{worker.name}</h3>
                  <p className="text-sm text-gray-600">{worker.type} • ${worker.ratePerHour}/hour</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Hours: <span className="font-medium">{totalHours.toFixed(1)}h</span></p>
                  <p className="text-sm text-gray-600">Total Cost: <span className="font-medium text-green-600">${totalCost.toFixed(2)}</span></p>
                </div>
              </div>
              {tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.type}</p>
                        <p className="text-xs text-gray-600">{task.farmName} • {new Date(task.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{task.estimatedHours}h</p>
                        <p className="text-xs text-gray-600">${task.labourCost?.toFixed(2)}</p>
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

      {/* Cost Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Cost Analysis</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Estimated vs Actual</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estimated Hours:</span>
                  <span className="text-sm font-medium">{totalEstimatedHours.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Actual Hours:</span>
                  <span className="text-sm font-medium">{totalActualHours.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estimated Cost:</span>
                  <span className="text-sm font-medium">${totalEstimatedCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Actual Cost:</span>
                  <span className="text-sm font-medium">${totalActualCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-medium text-gray-900">Variance:</span>
                  <span className={`text-sm font-bold ${
                    (totalActualCost - totalEstimatedCost) > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    ${Math.abs(totalActualCost - totalEstimatedCost).toFixed(2)} 
                    {(totalActualCost - totalEstimatedCost) > 0 ? ' over' : ' under'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Task Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed:</span>
                  <span className="text-sm font-medium text-green-600">{completedTasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">In Progress:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {weekTasks.filter(t => t.status === 'in_progress').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending:</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {weekTasks.filter(t => t.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-medium text-gray-900">Completion Rate:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {weekTasks.length > 0 ? ((completedTasks.length / weekTasks.length) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabourScheduler;

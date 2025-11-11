import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Plus, Edit, Trash2, Key } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'worker';
  phone: string;
  status: 'active' | 'inactive';
  assignedFarms?: string[];
  createdAt: Date;
}

const Users: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'manager' | 'worker';
    phone: string;
    status: 'active' | 'inactive';
    assignedFarms: string[];
  }>({
    name: '',
    email: '',
    role: 'worker',
    phone: '',
    status: 'active',
    assignedFarms: []
  });
  const [farms, setFarms] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'farms'), (snapshot) => {
      setFarms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as User[];
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData: any = {
        name: newUser.name,
        email: newUser.email.toLowerCase(),
        role: newUser.role,
        phone: newUser.phone,
        status: newUser.status,
        password: 'Karibu@123',
        isDefaultPassword: true,
        createdAt: new Date()
      };
      
      if (newUser.role === 'admin' || newUser.role === 'manager') {
        userData.assignedFarms = newUser.assignedFarms;
      }
      
      await addDoc(collection(db, 'users'), userData);
      setNewUser({ name: '', email: '', role: 'worker', phone: '', status: 'active', assignedFarms: [] });
      setShowAddForm(false);
      showToast('User added successfully', 'success');
    } catch (error: any) {
      console.error('Add user error:', error);
      showToast(error.message || 'Failed to add user', 'error');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        phone: editingUser.phone,
        status: editingUser.status,
        assignedFarms: (editingUser.role === 'admin' || editingUser.role === 'manager') ? editingUser.assignedFarms : undefined
      });
      setEditingUser(null);
      showToast('User updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update user', 'error');
    }
  };

  const handleUpdateStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      showToast(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (error) {
      showToast('Failed to update user status', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        showToast('User deleted successfully', 'success');
      } catch (error) {
        showToast('Failed to delete user', 'error');
      }
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (window.confirm(`Reset password for ${userName}? They will need to change it on next login.`)) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          password: 'Karibu@123',
          isDefaultPassword: true
        });
        showToast('Password reset successfully', 'success');
      } catch (error) {
        showToast('Failed to reset password', 'error');
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'worker': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'manager': return 'Manager';
      case 'worker': return 'Worker';
      default: return role;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Staffing Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Add New Staff Member</h2>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="border rounded-lg px-3 py-2"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="border rounded-lg px-3 py-2"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              className="border rounded-lg px-3 py-2"
              required
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
              className="border rounded-lg px-3 py-2"
            >
              <option value="worker">Worker</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            {(newUser.role === 'admin' || newUser.role === 'manager') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Farms</label>
                <div className="grid grid-cols-2 gap-2">
                  {farms.map(farm => (
                    <label key={farm.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newUser.assignedFarms.includes(farm.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUser({ ...newUser, assignedFarms: [...newUser.assignedFarms, farm.id] });
                          } else {
                            setNewUser({ ...newUser, assignedFarms: newUser.assignedFarms.filter(id => id !== farm.id) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{farm.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Add Staff
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {editingUser && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Edit Staff Member</h2>
          <form onSubmit={handleEditUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={editingUser.name}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              className="border rounded-lg px-3 py-2"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={editingUser.email}
              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              className="border rounded-lg px-3 py-2"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={editingUser.phone}
              onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
              className="border rounded-lg px-3 py-2"
              required
            />
            <select
              value={editingUser.role}
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
              className="border rounded-lg px-3 py-2"
            >
              <option value="worker">Worker</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            {(editingUser.role === 'admin' || editingUser.role === 'manager') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Farms</label>
                <div className="grid grid-cols-2 gap-2">
                  {farms.map(farm => (
                    <label key={farm.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingUser.assignedFarms?.includes(farm.id) || false}
                        onChange={(e) => {
                          const currentFarms = editingUser.assignedFarms || [];
                          if (e.target.checked) {
                            setEditingUser({ ...editingUser, assignedFarms: [...currentFarms, farm.id] });
                          } else {
                            setEditingUser({ ...editingUser, assignedFarms: currentFarms.filter(id => id !== farm.id) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{farm.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Update Staff
              </button>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                      {user.assignedFarms && user.assignedFarms.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {user.assignedFarms.length} farm(s)
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(user.id, user.status)}
                        className={`${user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id, user.name)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Reset password"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete user"
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
    </div>
  );
};

export default Users;
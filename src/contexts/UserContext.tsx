import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'worker';
  status: string;
  assignedFarms?: string[];
  phone?: string;
  photoUrl?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isWorker: boolean;
  canManageFarm: (farmId: string) => boolean;
  canViewFinancials: boolean;
  canManageUsers: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [user]);

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;
  const isManager = user?.role === 'manager' || isAdmin;
  const isWorker = user?.role === 'worker';
  
  const canManageFarm = (farmId: string) => {
    if (isSuperAdmin) return true;
    if (user?.role === 'admin' || user?.role === 'manager') {
      return !user.assignedFarms || user.assignedFarms.includes(farmId);
    }
    return false;
  };
  
  const canViewFinancials = isSuperAdmin || user?.role === 'admin' || user?.role === 'manager';
  const canManageUsers = isSuperAdmin || user?.role === 'admin';

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      isSuperAdmin,
      isAdmin,
      isManager,
      isWorker,
      canManageFarm,
      canViewFinancials,
      canManageUsers
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
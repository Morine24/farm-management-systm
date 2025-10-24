import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'worker' | 'financial_manager';
  status: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isManager: boolean;
  isWorker: boolean;
  isFinancialManager: boolean;
  isAdmin: boolean;
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

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isWorker = user?.role === 'worker';
  const isFinancialManager = user?.role === 'financial_manager';
  const isAdmin = user?.role === 'admin';

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      isManager,
      isWorker,
      isFinancialManager,
      isAdmin
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
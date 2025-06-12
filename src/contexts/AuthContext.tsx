
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: User[] = [
  {
    id: '1',
    email: 'generator@waste.com',
    role: 'waste-generator',
    name: 'John Smith',
    company: 'Green Industries Inc.',
    status: 'approved'
  },
  {
    id: '2',
    email: 'recycler@eco.com',
    role: 'recycler',
    name: 'Sarah Johnson',
    company: 'EcoRecycle Ltd.',
    status: 'approved'
  },
  {
    id: '3',
    email: 'aggregator@aggregate.com',
    role: 'aggregator',
    name: 'Mike Wilson',
    company: 'Waste Aggregators Co.',
    status: 'approved'
  },
  {
    id: '4',
    email: 'admin@platform.com',
    role: 'admin',
    name: 'Admin User',
    company: 'Platform Admin',
    status: 'approved'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && foundUser.status === 'approved') {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
    } else {
      throw new Error('Invalid credentials or account not approved');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const register = async (userData: any) => {
    // Mock registration - in real app would call API
    console.log('Registration data:', userData);
    throw new Error('Registration submitted for approval');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

  import React, { createContext, useContext, useState, useEffect } from 'react';

  interface AuthContextType {
    user: any;
    login: (email: string, password: string) => Promise<any>;
    register: (userData: any) => Promise<any>;
    logout: () => void;
    loading: boolean;
  }

  const AuthContext = createContext<AuthContextType | undefined>(undefined);

  export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
    
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
      setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
  try {
    const response = await fetch('http://147.93.27.172/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('userId', data.user.id); // ✅ <-- add this
    setUser(data.user);

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};


    const logout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    };

    const register = async (userData: any) => {
      try {
        const formData = new FormData();
    
        // Add text fields
        Object.keys(userData).forEach(key => {
          if (key !== 'documents') {
            formData.append(key, userData[key]);
          }
        });

        // Add document files with proper field names
        if (userData.documents) {
          Object.entries(userData.documents).forEach(([type, file]: [string, any]) => {
            if (file) {
              formData.append(type, file);
            }
          });
        }

        const response = await fetch('http://147.93.27.172/api/auth/register', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }

        return data;
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    };

    return (
      <AuthContext.Provider value={{ user, login, logout, register, loading }}>
        {children}
      </AuthContext.Provider>
    );
  };

  export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  };

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
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
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
          // Check total file size
          let totalSize = 0;
          Object.entries(userData.documents).forEach(([_, file]: [string, any]) => {
            if (file) {
              totalSize += file.size;
            }
          });

          // 19MB limit (slightly under 20MB to be safe)
          const maxTotalSize = 19 * 1024 * 1024;
          if (totalSize > maxTotalSize) {
            throw new Error(`Total file size exceeds limit. Please reduce file sizes or compress your documents.`);
          }

          // Add files to form data
          Object.entries(userData.documents).forEach(([type, file]: [string, any]) => {
            if (file) {
              formData.append(type, file);
            }
          });
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
          method: 'POST',
          body: formData,
        });

        // Handle non-JSON responses (like HTML error pages)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
          }
          
          return data;
        } else {
          // Handle non-JSON response (likely an error page)
          const text = await response.text();
          if (response.status === 413) {
            throw new Error('Files are too large. Please reduce file sizes or compress your documents.');
          } else {
            throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
          }
        }
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

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  role: UserRole;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (userId: string, role: UserRole, additionalData?: Partial<User>) => {
    const userData: User = {
      id: userId,
      role,
      ...additionalData
    };
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    // Force page refresh to ensure complete logout
    window.location.reload();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout
  };
}
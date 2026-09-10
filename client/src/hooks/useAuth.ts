import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  role: UserRole;
  email?: string;
  username?: string;
  profileId?: string;
  mustChangePassword?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount and validate with server
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check localStorage for quick hydration
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);

            // Validate session with server
            const response = await apiRequest('GET', '/api/auth/me');
            if (response.ok) {
              const data = await response.json();
              // Update user with server-confirmed role, profileId and password flag
              setUser(prev => prev ? { ...prev, role: data.role, id: data.id, profileId: data.profileId, mustChangePassword: data.mustChangePassword } : null);
            } else {
              // Session invalid - clear localStorage
              localStorage.removeItem('currentUser');
              setUser(null);
            }
          } catch {
            localStorage.removeItem('currentUser');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Session validation error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = useCallback(async (userId: string, role: UserRole, additionalData?: Partial<User>) => {
    const userData: User = {
      id: userId,
      role,
      ...additionalData,
    };
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  }, []);

  // Called after the user completes the forced first-login password change.
  const markPasswordChanged = useCallback(() => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, mustChangePassword: false };
      localStorage.setItem('currentUser', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
    } catch {
      // Continue with client-side logout even if API fails
    }
    setUser(null);
    localStorage.removeItem('currentUser');
    window.location.reload();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    markPasswordChanged,
  };
}
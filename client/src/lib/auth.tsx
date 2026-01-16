import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@shared/schema";
import { apiRequest } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (data: { username: string; password: string; email: string; fullName: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        toast({ title: "Welcome back!", description: `Logged in as ${data.user.fullName}` });
        return true;
      }
      toast({ title: "Login failed", description: data.message || "Invalid credentials", variant: "destructive" });
      return false;
    } catch (error) {
      toast({ title: "Login failed", description: "Something went wrong. Please try again.", variant: "destructive" });
      return false;
    }
  };

  const register = async (data: { username: string; password: string; email: string; fullName: string }): Promise<boolean> => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", data);
      const result = await response.json();
      if (response.ok) {
        setUser(result.user);
        toast({ title: "Welcome to SkillSwap!", description: "Your account has been created successfully." });
        return true;
      }
      toast({ title: "Registration failed", description: result.message || "Could not create account", variant: "destructive" });
      return false;
    } catch (error) {
      toast({ title: "Registration failed", description: "Something went wrong. Please try again.", variant: "destructive" });
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setUser(null);
      toast({ title: "Logged out", description: "You have been logged out successfully." });
    } catch {
      toast({ title: "Error", description: "Could not log out", variant: "destructive" });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

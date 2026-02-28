import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GraduationCap, Lock, User } from "lucide-react";
import type { UserRole } from "@/hooks/useAuth";

interface LoginFormProps {
  onLogin: (userId: string, role: UserRole, additionalData?: Record<string, any>) => void;
  onShowSignup: () => void;
}

export function LoginForm({ onLogin, onShowSignup }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await response.json();

      if (data.success) {
        onLogin(data.id, data.role, {
          username: data.username,
          email: data.email,
          profileId: data.profileId,
        });
        toast({ title: `Welcome ${data.username}!`, description: "Login successful" });
      }
    } catch (error: any) {
      let errorMessage = "Login failed. Please try again.";
      
      // Try to extract meaningful error message
      try {
        if (error?.message) {
          const parsed = JSON.parse(error.message);
          if (parsed.message) {
            // Handle specific error cases
            if (parsed.message.includes("Invalid credentials")) {
              errorMessage = "Invalid username or password";
            } else if (parsed.message.includes("Authentication required")) {
              errorMessage = "Session expired. Please login again.";
            } else {
              errorMessage = parsed.message;
            }
          }
        }
      } catch {
        // Keep default error message
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (userRole: UserRole) => {
    switch (userRole) {
      case 'admin': return <Lock className="w-5 h-5" />;
      case 'teacher': return <GraduationCap className="w-5 h-5" />;
      case 'student': return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Pathshala Saathi</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="role">User Role</Label>
              <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(role)}
                      <span className="capitalize">{role}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Administrator</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="teacher">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Teacher</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="student">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Student</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Demo Credentials:</strong> admin/admin123, teacher/teacher123, student/student123
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Don't have an account?
            </p>
            <Button
              variant="outline"
              onClick={onShowSignup}
              className="w-full"
              data-testid="button-show-signup"
            >
              Create Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
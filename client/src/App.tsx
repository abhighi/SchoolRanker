import { Switch, Route, useLocation } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { useAuth, type UserRole } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Teachers from "@/pages/teachers";
import Courses from "@/pages/courses";
import Attendance from "@/pages/attendance";
import Marks from "@/pages/marks";
import Analytics from "@/pages/analytics";
import TeacherPanel from "@/pages/teacher-panel";
import StudentPanel from "@/pages/student-panel";
import NotFound from "@/pages/not-found";
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface RouterProps {
  userRole: UserRole;
  userId: string;
}

function Router({ userRole, userId }: RouterProps) {
  const [location, setLocation] = useLocation();

  // Role-based routing logic
  const getDefaultRoute = (role: UserRole) => {
    switch (role) {
      case 'admin': return '/';
      case 'teacher': return '/teacher-panel';
      case 'student': return '/student-panel';
    }
  };

  // Redirect to appropriate dashboard on login
  if (location === '/login' || location === '/') {
    const defaultRoute = getDefaultRoute(userRole);
    if (location !== defaultRoute) {
      setLocation(defaultRoute);
    }
  }

  // Access control based on role
  const hasAccess = (path: string, role: UserRole): boolean => {
    const adminPaths = ['/', '/students', '/teachers', '/courses', '/attendance', '/marks', '/analytics'];
    const teacherPaths = ['/teacher-panel', '/students', '/courses', '/attendance', '/marks'];
    const studentPaths = ['/student-panel'];

    switch (role) {
      case 'admin': return adminPaths.includes(path) || teacherPaths.includes(path) || studentPaths.includes(path);
      case 'teacher': return teacherPaths.includes(path);
      case 'student': return studentPaths.includes(path);
      default: return false;
    }
  };

  return (
    <div className="flex md:h-screen min-h-screen overflow-hidden">
      <div className="hidden md:block">
        <Sidebar userRole={userRole} userId={userId} />
      </div>
      <main className="flex-1 overflow-auto">
        {/* Mobile Top Bar with Drawer menu */}
        <div className="md:hidden sticky top-0 z-40 bg-white border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[85vh] p-0">
                <div className="h-full overflow-auto">
                  <Sidebar userRole={userRole} userId={userId} variant="mobile" />
                  <div className="p-4">
                    <DrawerClose asChild>
                      <Button className="w-full">Close</Button>
                    </DrawerClose>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
            <span className="font-semibold">Pathshala Saathi</span>
            <span className="w-9" />
          </div>
        </div>
        <Switch>
          {/* Admin Routes */}
          {userRole === 'admin' && (
            <>
              <Route path="/" component={Dashboard} />
              <Route path="/students" component={Students} />
              <Route path="/teachers" component={Teachers} />
              <Route path="/courses" component={Courses} />
              <Route path="/attendance" component={Attendance} />
              <Route path="/marks" component={Marks} />
              <Route path="/analytics" component={Analytics} />
            </>
          )}

          {/* Teacher Routes */}
          {(userRole === 'teacher' || userRole === 'admin') && (
            <>
              <Route path="/teacher-panel" component={TeacherPanel} />
              {userRole === 'teacher' && (
                <>
                  <Route path="/students" component={Students} />
                  <Route path="/courses" component={Courses} />
                  <Route path="/attendance" component={Attendance} />
                  <Route path="/marks" component={Marks} />
                </>
              )}
            </>
          )}

          {/* Student Routes */}
          {(userRole === 'student' || userRole === 'admin') && (
            <Route path="/student-panel" component={StudentPanel} />
          )}

          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  const { user, isLoading, login } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {!user ? (
          showSignup ? (
            <SignupForm 
              onSignup={login}
              onBackToLogin={() => setShowSignup(false)}
            />
          ) : (
            <LoginForm 
              onLogin={login}
              onShowSignup={() => setShowSignup(true)}
            />
          )
        ) : (
          <Router userRole={user.role} userId={user.id} />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

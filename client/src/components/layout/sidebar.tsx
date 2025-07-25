import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { 
  GraduationCap, Home, Users, Presentation, 
  BookOpen, CalendarCheck, BarChart3, TrendingUp, 
  ChevronLeft, ChevronRight, UserCheck, GraduationCapIcon
} from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    name: "Students",
    href: "/students",
    icon: Users,
  },
  {
    name: "Teachers",
    href: "/teachers",
    icon: Presentation,
  },
  {
    name: "Courses",
    href: "/courses",
    icon: BookOpen,
  },
  {
    name: "Attendance",
    href: "/attendance",
    icon: CalendarCheck,
  },
  {
    name: "Marks & Rankings",
    href: "/marks",
    icon: TrendingUp,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
];

const rolePanels = [
  {
    name: "Teacher Panel",
    href: "/teacher-panel",
    icon: Presentation,
    description: "For Teachers"
  },
  {
    name: "Student Panel", 
    href: "/student-panel",
    icon: GraduationCapIcon,
    description: "For Students"
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={cn(
      "bg-white shadow-lg border-r border-gray-200 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <GraduationCap className="text-primary text-2xl" size={32} />
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-800 ml-3">EduManage</h1>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="p-1 h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 px-2 py-6 space-y-4">
        {/* Admin Section */}
        <div className="space-y-2">
          {!isCollapsed && (
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Administration
              </h3>
            </div>
          )}
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-3 py-3 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer",
                    isActive && "bg-primary text-white hover:bg-blue-600 hover:text-white",
                    isCollapsed ? "justify-center" : "space-x-3"
                  )}
                >
                  <Icon className="w-5 h-5 text-current flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Role Panels Section */}
        <div className="space-y-2 border-t border-gray-200 pt-4">
          {!isCollapsed && (
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Role Panels
              </h3>
            </div>
          )}
          {rolePanels.map((panel) => {
            const Icon = panel.icon;
            const isActive = location === panel.href;
            
            return (
              <Link key={panel.href} href={panel.href}>
                <div
                  className={cn(
                    "flex items-center px-3 py-3 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer",
                    isActive && "bg-green-600 text-white hover:bg-green-700 hover:text-white",
                    isCollapsed ? "justify-center" : "space-x-3"
                  )}
                >
                  <Icon className="w-5 h-5 text-current flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{panel.name}</span>
                      <span className="text-xs opacity-75">{panel.description}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* User Profile */}
      <div className="px-2 py-4 border-t border-gray-200">
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "space-x-3 px-2"
        )}>
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-gray-600" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  GraduationCap, Home, Users, Presentation, 
  BookOpen, CalendarCheck, BarChart3, TrendingUp 
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

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo Header */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <GraduationCap className="text-primary text-2xl mr-3" size={32} />
        <h1 className="text-xl font-bold text-gray-800">EduManage</h1>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer",
                  isActive && "bg-primary text-white hover:bg-blue-600 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 text-current" />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>
      
      {/* User Profile */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

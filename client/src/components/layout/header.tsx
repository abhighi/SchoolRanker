import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationSystem } from "@/components/notifications/notification-system";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  title: string;
  subtitle: string;
  onAddClick?: () => void;
  addButtonText?: string;
}

export function Header({ title, subtitle, onAddClick, addButtonText = "Add New" }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <NotificationSystem userRole={user.role} userId={user.id} />
          )}
          {onAddClick && (
            <Button onClick={onAddClick} className="bg-primary text-white hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              {addButtonText}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

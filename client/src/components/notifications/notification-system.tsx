import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, X, Clock, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationSystemProps {
  userRole: 'admin' | 'teacher' | 'student';
  userId: string;
}

export function NotificationSystem({ userRole, userId }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { toast } = useToast();

  // Generate sample notifications based on user role
  useEffect(() => {
    const generateNotifications = () => {
      const baseNotifications: Notification[] = [];
      
      if (userRole === 'student') {
        baseNotifications.push(
          {
            id: '1',
            title: 'Assignment Due Tomorrow',
            message: 'Your Math homework is due tomorrow at 11:59 PM',
            type: 'warning',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            read: false,
            actionUrl: '/student-panel'
          },
          {
            id: '2',
            title: 'New Assignment Posted',
            message: 'Science project has been assigned - Due in 1 week',
            type: 'info',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            read: false,
            actionUrl: '/student-panel'
          },
          {
            id: '3',
            title: 'Grade Updated',
            message: 'Your English essay has been graded - 95/100',
            type: 'success',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            read: true
          }
        );
      } else if (userRole === 'teacher') {
        baseNotifications.push(
          {
            id: '4',
            title: 'New Student Submission',
            message: '5 students have submitted their assignments',
            type: 'info',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            read: false,
            actionUrl: '/teacher-panel'
          },
          {
            id: '5',
            title: 'Attendance Reminder',
            message: 'Don\'t forget to mark attendance for today',
            type: 'warning',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
            read: false,
            actionUrl: '/teacher-panel'
          },
          {
            id: '6',
            title: 'Grade Deadline',
            message: 'Grades for midterm exams are due in 2 days',
            type: 'warning',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            read: true
          }
        );
      } else if (userRole === 'admin') {
        baseNotifications.push(
          {
            id: '7',
            title: 'System Backup Complete',
            message: 'Daily system backup completed successfully',
            type: 'success',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            read: false
          },
          {
            id: '8',
            title: 'New Teacher Registration',
            message: 'John Smith has registered as a new teacher',
            type: 'info',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
            read: false,
            actionUrl: '/teachers'
          },
          {
            id: '9',
            title: 'Low Attendance Alert',
            message: 'Class 10-A has attendance below 80% this week',
            type: 'warning',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
            read: true,
            actionUrl: '/attendance'
          }
        );
      }
      
      setNotifications(baseNotifications);
    };

    generateNotifications();
  }, [userRole]);

  // Show toast notifications for new unread notifications
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length > 0 && notifications.length > 0) {
      // Show toast for the most recent unread notification
      const latest = unreadNotifications[0];
      toast({
        title: latest.title,
        description: latest.message,
        variant: latest.type === 'error' ? 'destructive' : 'default'
      });
    }
  }, [notifications, toast]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getNotificationIcon(notification.type)}
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                        <div className="flex space-x-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs h-6 px-2"
                            >
                              Mark read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-center"
              onClick={() => setShowDropdown(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
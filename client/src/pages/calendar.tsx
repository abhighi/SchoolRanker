import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";

interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    eventDate: string;
    startTime?: string;
    endTime?: string;
    eventType: string;
    grade?: number;
    createdBy?: string;
}

const EVENT_TYPES = [
    { value: "event", label: "General Event" },
    { value: "holiday", label: "Holiday" },
    { value: "exam", label: "Exam" },
    { value: "meeting", label: "Meeting" },
];

const EVENT_COLORS: Record<string, string> = {
    event: "bg-blue-100 text-blue-800",
    holiday: "bg-green-100 text-green-800",
    exam: "bg-red-100 text-red-800",
    meeting: "bg-purple-100 text-purple-800",
};

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showEventDialog, setShowEventDialog] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        eventDate: "",
        startTime: "",
        endTime: "",
        eventType: "event",
        grade: "",
    });

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const { data: events = [] } = useQuery<CalendarEvent[]>({
        queryKey: [`/api/calendar/events?year=${year}&month=${month + 1}`],
    });

    // The events query key includes year/month, so invalidate every calendar
    // query rather than a single fixed key.
    const invalidateEvents = () =>
        queryClient.invalidateQueries({
            predicate: (q) => String(q.queryKey[0]).startsWith("/api/calendar/events"),
        });

    const createMutation = useMutation({
        mutationFn: (data: any) => apiRequest("POST", "/api/calendar/events", data),
        onSuccess: () => {
            invalidateEvents();
            toast({ title: "Event created successfully" });
            setShowEventDialog(false);
            resetForm();
        },
        onError: () => {
            toast({ title: "Failed to create event", variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            apiRequest("PUT", `/api/calendar/events/${id}`, data),
        onSuccess: () => {
            invalidateEvents();
            toast({ title: "Event updated successfully" });
            setShowEventDialog(false);
            resetForm();
        },
        onError: () => {
            toast({ title: "Failed to update event", variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiRequest("DELETE", `/api/calendar/events/${id}`),
        onSuccess: () => {
            invalidateEvents();
            toast({ title: "Event deleted successfully" });
        },
        onError: () => {
            toast({ title: "Failed to delete event", variant: "destructive" });
        },
    });

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            eventDate: "",
            startTime: "",
            endTime: "",
            eventType: "event",
            grade: "",
        });
        setEditingEvent(null);
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setFormData({
            ...formData,
            eventDate: date.toISOString().split("T")[0],
        });
        setShowEventDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const eventData = {
            ...formData,
            grade: formData.grade && formData.grade !== "all" ? parseInt(formData.grade) : undefined,
        };
        if (editingEvent) {
            updateMutation.mutate({ id: editingEvent.id, data: eventData });
        } else {
            createMutation.mutate(eventData);
        }
    };

    const getDaysInMonth = () => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const days = [];

        // Previous month days
        for (let i = 0; i < firstDayOfMonth; i++) {
            const prevDate = new Date(year, month, -firstDayOfMonth + i + 1);
            days.push({ date: prevDate, isCurrentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        // Next month days
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }

        return days;
    };

    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split("T")[0];
        return events.filter((event) => event.eventDate === dateStr);
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const days = getDaysInMonth();

    return (
        <div>
            <Header
                title="Calendar"
                subtitle="Manage school events, holidays, and schedules"
            />

            <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xl font-bold">
                        {monthNames[month]} {year}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleNextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => {
                            setSelectedDate(new Date());
                            setFormData({
                                ...formData,
                                eventDate: new Date().toISOString().split("T")[0],
                            });
                            setShowEventDialog(true);
                        }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Event
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNames.map((day) => (
                            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => {
                            const dayEvents = getEventsForDate(day.date);
                            const isToday = day.date.toDateString() === new Date().toDateString();
                            const isSelected = selectedDate?.toDateString() === day.date.toDateString();

                            return (
                                <div
                                    key={index}
                                    onClick={() => handleDateClick(day.date)}
                                    className={`
                    min-h-[80px] p-1 border rounded cursor-pointer transition-colors
                    ${day.isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"}
                    ${isToday ? "ring-2 ring-blue-500" : ""}
                    ${isSelected ? "bg-blue-50" : "hover:bg-gray-100"}
                  `}
                                >
                                    <div className={`text-sm font-medium ${isToday ? "text-blue-600" : ""}`}>
                                        {day.date.getDate()}
                                    </div>
                                    <div className="space-y-1 mt-1">
                                        {dayEvents.slice(0, 2).map((event) => (
                                            <div
                                                key={event.id}
                                                className={`text-xs p-1 rounded truncate ${EVENT_COLORS[event.eventType] || "bg-gray-100"}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingEvent(event);
                                                    setFormData({
                                                        title: event.title,
                                                        description: event.description || "",
                                                        eventDate: event.eventDate,
                                                        startTime: event.startTime || "",
                                                        endTime: event.endTime || "",
                                                        eventType: event.eventType,
                                                        grade: event.grade?.toString() || "",
                                                    });
                                                    setShowEventDialog(true);
                                                }}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Event type legend */}
                    <div className="flex gap-4 mt-4 pt-4 border-t">
                        {EVENT_TYPES.map((type) => (
                            <div key={type.value} className="flex items-center gap-2">
                                <Badge className={EVENT_COLORS[type.value]}>{type.label}</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Event Dialog */}
            <Dialog open={showEventDialog} onOpenChange={() => {
                setShowEventDialog(false);
                resetForm();
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="eventDate">Date</Label>
                            <Input
                                id="eventDate"
                                type="date"
                                value={formData.eventDate}
                                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="eventType">Event Type</Label>
                            <Select
                                value={formData.eventType}
                                onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {EVENT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="grade">Grade (optional)</Label>
                            <Select
                                value={formData.grade || "all"}
                                onValueChange={(value) => setFormData({ ...formData, grade: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All grades" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All grades</SelectItem>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                                        <SelectItem key={g} value={g.toString()}>
                                            Grade {g}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter className="flex justify-between">
                            {editingEvent && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => {
                                        if (confirm("Are you sure you want to delete this event?")) {
                                            deleteMutation.mutate(editingEvent.id);
                                            setShowEventDialog(false);
                                            resetForm();
                                        }
                                    }}
                                >
                                    Delete
                                </Button>
                            )}
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => {
                                    setShowEventDialog(false);
                                    resetForm();
                                }}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {editingEvent ? "Update" : "Create"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Megaphone, Trash2, Send, MessageSquare } from "lucide-react";

interface AnnouncementComment {
  id: string;
  announcementId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  targetGrade: number | null;
  createdAt: string;
  comments: AnnouncementComment[];
}

interface Course {
  id: string;
  grade: number;
}

const ALL_GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const EVERYONE = "everyone";

const roleBadge: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  teacher: "bg-blue-100 text-blue-800",
  student: "bg-green-100 text-green-800",
};

function formatDate(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function Announcements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canPost = user?.role === "admin" || user?.role === "teacher";

  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", target: EVERYONE });
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  // For teachers we limit the target grades to the grades they teach; for admins
  // we offer every grade. (The server enforces this either way.)
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    enabled: user?.role === "teacher",
  });

  const teacherGrades = Array.from(new Set(courses.map(c => c.grade))).sort((a, b) => a - b);
  const gradeOptions = user?.role === "teacher" ? teacherGrades : ALL_GRADES;

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; targetGrade: number | null }) =>
      apiRequest("POST", "/api/announcements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setShowDialog(false);
      setForm({ title: "", content: "", target: EVERYONE });
      toast({ title: "Announcement posted" });
    },
    onError: (err: any) => {
      toast({ title: "Could not post", description: err?.message ?? "Please try again", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Announcement deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Could not delete", description: err?.message ?? "Please try again", variant: "destructive" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      apiRequest("POST", `/api/announcements/${id}/comments`, { content }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setCommentDrafts(prev => ({ ...prev, [vars.id]: "" }));
    },
    onError: (err: any) => {
      toast({ title: "Could not comment", description: err?.message ?? "Please try again", variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({ announcementId, commentId }: { announcementId: string; commentId: string }) =>
      apiRequest("DELETE", `/api/announcements/${announcementId}/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
    },
    onError: (err: any) => {
      toast({ title: "Could not delete comment", description: err?.message ?? "Please try again", variant: "destructive" });
    },
  });

  const submitAnnouncement = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Title and message are required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      title: form.title.trim(),
      content: form.content.trim(),
      targetGrade: form.target === EVERYONE ? null : parseInt(form.target, 10),
    });
  };

  const canDeleteAnnouncement = (a: Announcement) =>
    user?.role === "admin" || a.authorId === user?.id;

  const canDeleteComment = (a: Announcement, c: AnnouncementComment) =>
    user?.role === "admin" || c.authorId === user?.id || a.authorId === user?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Announcements"
        subtitle="School-wide and class notices"
        {...(canPost ? { onAddClick: () => setShowDialog(true), addButtonText: "New Announcement" } : {})}
      />

      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {isLoading ? (
          <p className="text-gray-500 text-center py-12">Loading announcements…</p>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Megaphone className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">No announcements yet</p>
              <p className="text-sm text-gray-400">
                {canPost ? "Post the first announcement using the button above." : "Check back later for updates."}
              </p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((a) => (
            <Card key={a.id} data-testid={`announcement-${a.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-lg break-words">{a.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-sm font-medium text-gray-700">{a.authorName}</span>
                      <Badge className={roleBadge[a.authorRole] ?? "bg-gray-100 text-gray-700"}>
                        {a.authorRole}
                      </Badge>
                      <Badge variant="outline">
                        {a.targetGrade === null ? "Everyone" : `Grade ${a.targetGrade}`}
                      </Badge>
                      <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                    </div>
                  </div>
                  {canDeleteAnnouncement(a) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      onClick={() => deleteMutation.mutate(a.id)}
                      data-testid={`delete-announcement-${a.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap break-words">{a.content}</p>

                {/* Comments */}
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>{a.comments.length} comment{a.comments.length === 1 ? "" : "s"}</span>
                  </div>

                  <div className="space-y-2">
                    {a.comments.map((c) => (
                      <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2" data-testid={`comment-${c.id}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">{c.authorName}</span>
                              <Badge className={roleBadge[c.authorRole] ?? "bg-gray-100 text-gray-700"}>
                                {c.authorRole}
                              </Badge>
                              <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">{c.content}</p>
                          </div>
                          {canDeleteComment(a, c) && (
                            <button
                              className="text-gray-400 hover:text-red-600 flex-shrink-0"
                              onClick={() => deleteCommentMutation.mutate({ announcementId: a.id, commentId: c.id })}
                              data-testid={`delete-comment-${c.id}`}
                              aria-label="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add comment (all authenticated users) */}
                  <div className="flex items-center gap-2 mt-3">
                    <Input
                      value={commentDrafts[a.id] ?? ""}
                      placeholder="Write a comment…"
                      onChange={(e) => setCommentDrafts(prev => ({ ...prev, [a.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (commentDrafts[a.id] ?? "").trim()) {
                          commentMutation.mutate({ id: a.id, content: (commentDrafts[a.id] ?? "").trim() });
                        }
                      }}
                      data-testid={`comment-input-${a.id}`}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const content = (commentDrafts[a.id] ?? "").trim();
                        if (content) commentMutation.mutate({ id: a.id, content });
                      }}
                      disabled={!(commentDrafts[a.id] ?? "").trim() || commentMutation.isPending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New announcement dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Parent-Teacher Meeting"
                data-testid="announcement-title-input"
              />
            </div>
            <div>
              <Label htmlFor="ann-content">Message</Label>
              <Textarea
                id="ann-content"
                rows={5}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write your announcement…"
                data-testid="announcement-content-input"
              />
            </div>
            <div>
              <Label htmlFor="ann-target">Audience</Label>
              <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                <SelectTrigger id="ann-target" data-testid="announcement-target-select">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EVERYONE}>Everyone (whole school)</SelectItem>
                  {gradeOptions.map((g) => (
                    <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {user?.role === "teacher" && teacherGrades.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  You have no assigned classes yet, so you can only post to everyone.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={submitAnnouncement} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Posting…" : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

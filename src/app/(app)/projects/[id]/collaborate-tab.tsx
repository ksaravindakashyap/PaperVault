"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Copy, Check, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Member {
  id: string;
  userId: string;
  userName: string;
  role: string;
  createdAt: string;
}

interface Doc {
  id: string;
  title: string;
  paperId: string | null;
  paper: { id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ActivityEvent {
  id: string;
  action: string;
  actor: { id: string; name: string };
  doc: { id: string; title: string } | null;
  metadata: any;
  createdAt: string;
}

interface CollaborateTabProps {
  projectId: string;
  currentUserRole: string | null;
}

export function CollaborateTab({ projectId, currentUserRole }: CollaborateTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isNewDocDialogOpen, setIsNewDocDialogOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<"OWNER" | "EDITOR" | "COMMENTER">("COMMENTER");
  const [inviteExpiresInDays, setInviteExpiresInDays] = useState<number>(30);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copiedInviteUrl, setCopiedInviteUrl] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  const isOwner = currentUserRole === "OWNER";
  const isEditor = currentUserRole === "EDITOR" || isOwner;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [membersRes, docsRes, activityRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/members`),
        fetch(`/api/projects/${projectId}/docs`),
        fetch(`/api/projects/${projectId}/activity`),
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocs(docsData);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivity(activityData);
      }
    } catch (error) {
      console.error("Failed to load collaborate data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleCreateInvite = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: inviteRole,
          expiresInDays: inviteExpiresInDays,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInviteUrl(data.inviteUrl);
        setIsInviteDialogOpen(false); // Close dialog so user can see the link
        toast({
          title: "Invite created",
          description: "Copy the link to share with others",
        });
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to create invite",
          description: data.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create invite",
        description: "An error occurred",
      });
    }
  };

  const handleCopyInviteUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInviteUrl(true);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
    setTimeout(() => setCopiedInviteUrl(false), 2000);
  };

  const handleCreateDoc = async () => {
    if (!newDocTitle.trim()) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDocTitle,
          content: newDocContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsNewDocDialogOpen(false);
        setNewDocTitle("");
        setNewDocContent("");
        loadData();
        router.push(`/docs/${data.id}`);
        toast({
          title: "Doc created",
          description: "Redirecting to doc editor...",
        });
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to create doc",
          description: data.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create doc",
        description: "An error occurred",
      });
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    setIsDeletingMember(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${memberToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        loadData();
        setMemberToDelete(null);
        toast({
          title: "Member removed",
          description: `${memberToDelete.userName} has been removed from the project`,
        });
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to remove member",
          description: data.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to remove member",
        description: "An error occurred",
      });
    } finally {
      setIsDeletingMember(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Members Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Members</h3>
        </div>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div>
                <p className="font-medium text-gray-900">{member.userName}</p>
                <p className="text-sm text-gray-500">
                  {member.role.replace(/_/g, " ")}
                </p>
              </div>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMemberToDelete(member)}
                  className="text-red-600 hover:text-red-700"
                  disabled={member.role === "OWNER" && members.filter((m) => m.role === "OWNER").length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite Panel */}
      {isOwner && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Invite Members</h3>
            <Button onClick={() => setIsInviteDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Invite Link
            </Button>
          </div>
          {inviteUrl && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Invite Link:</p>
              <div className="flex items-center gap-2">
                <Input 
                  value={inviteUrl} 
                  readOnly 
                  className="flex-1 bg-white text-gray-900 border-gray-300 font-mono text-sm" 
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyInviteUrl}
                  title="Copy invite link"
                >
                  {copiedInviteUrl ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Docs Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Documents</h3>
          {isEditor && (
            <Button onClick={() => setIsNewDocDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Doc
            </Button>
          )}
        </div>
        {docs.length === 0 ? (
          <p className="text-sm text-gray-500">No documents yet</p>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <Link
                key={doc.id}
                href={`/docs/${doc.id}`}
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.title}</p>
                    {doc.paper && (
                      <p className="text-xs text-gray-500 mt-1">
                        Related to: {doc.paper.title}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Updated {formatDate(doc.updatedAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Activity Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-500">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {activity.map((event) => (
              <div key={event.id} className="text-sm">
                <p className="text-gray-900">
                  <span className="font-medium">{event.actor.name}</span>{" "}
                  {event.action.replace(/_/g, " ").toLowerCase()}
                  {event.doc && (
                    <span className="text-gray-600"> on "{event.doc.title}"</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(event.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="bg-white text-gray-900 border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Create Invite Link</DialogTitle>
            <DialogDescription className="text-gray-600">
              Generate a link to invite others to this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-role" className="text-gray-900">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(value: "OWNER" | "EDITOR" | "COMMENTER") =>
                  setInviteRole(value)
                }
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMMENTER">Commenter</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-expires" className="text-gray-900">
                Expires in (days)
              </Label>
              <Input
                id="invite-expires"
                type="number"
                min="1"
                max="365"
                value={inviteExpiresInDays}
                onChange={(e) =>
                  setInviteExpiresInDays(parseInt(e.target.value) || 30)
                }
                className="bg-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInviteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateInvite}>Create Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Doc Dialog */}
      <Dialog open={isNewDocDialogOpen} onOpenChange={setIsNewDocDialogOpen}>
        <DialogContent className="bg-white text-gray-900 border border-gray-200 shadow-lg max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Create New Document</DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a new document for this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doc-title" className="text-gray-900">Title</Label>
              <Input
                id="doc-title"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Document title"
                maxLength={500}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-content" className="text-gray-900">Content</Label>
              <textarea
                id="doc-content"
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                placeholder="Start writing..."
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewDocDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDoc}
              disabled={!newDocTitle.trim()}
            >
              Create Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Dialog */}
      <AlertDialog
        open={!!memberToDelete}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
      >
        <AlertDialogContent className="bg-white text-gray-900 border border-gray-200 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Remove Member?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This will remove {memberToDelete?.userName} from the project. They
              will no longer have access to project documents and comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingMember}
            >
              {isDeletingMember ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

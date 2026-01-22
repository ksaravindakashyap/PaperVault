"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DocTagsSection } from "./tags-section";

interface Doc {
  id: string;
  title: string;
  content: string;
  projectId: string;
  project: {
    id: string;
    name: string;
  };
  paperId: string | null;
  paper: {
    id: string;
    title: string;
  } | null;
  createdBy: string;
  updatedBy: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  anchorStart: number | null;
  anchorEnd: number | null;
  createdAt: string;
}

export default function DocDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [docId, setDocId] = useState<string>("");
  const [doc, setDoc] = useState<Doc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setDocId(p.id));
  }, [params]);

  const loadDoc = async () => {
    if (!docId) return;
    try {
      const response = await fetch(`/api/docs/${docId}`);
      if (response.ok) {
        const data = await response.json();
        setDoc(data);
        setTitle(data.title);
        setContent(data.content);
        setComments(data.comments || []);
        setTags(data.tags || []);

        // Check user role
        const userRes = await fetch("/api/me");
        const userData = await userRes.json();
        if (userData.user) {
          const membersRes = await fetch(`/api/projects/${data.projectId}/members`);
          if (membersRes.ok) {
            const members = await membersRes.json();
            const member = members.find((m: { userId: string; role: string }) => m.userId === userData.user.id);
            const role = member?.role || null;
            setCurrentUserRole(role);
            setCanEdit(role === "EDITOR" || role === "OWNER");
          }
        }
      } else if (response.status === 403) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have access to this document",
        });
        router.push("/projects");
      } else if (response.status === 404) {
        toast({
          variant: "destructive",
          title: "Not Found",
          description: "Document not found",
        });
        router.push("/projects");
      }
    } catch (error) {
      console.error("Failed to load doc:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load document",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (docId) {
      loadDoc();
    }
  }, [docId]);

  const handleSave = async () => {
    if (!docId) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/docs/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (response.ok) {
        toast({
          title: "Saved",
          description: "Document updated successfully",
        });
        loadDoc(); // Reload to get updated timestamp
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to save",
          description: data.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: "An error occurred while saving",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!docId || !newComment.trim()) return;
    setIsAddingComment(true);
    try {
      const response = await fetch(`/api/docs/${docId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: newComment.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([...comments, data]);
        setNewComment("");
        toast({
          title: "Comment added",
          description: "Your comment has been added",
        });
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to add comment",
          description: data.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add comment",
        description: "An error occurred",
      });
    } finally {
      setIsAddingComment(false);
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
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!doc) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <Link
            href={`/projects/${doc.projectId}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              {canEdit ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-bold border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Document title"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{doc.title}</h1>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Last updated {formatDate(doc.updatedAt)}
                {doc.paper && (
                  <span className="ml-2">
                    • Related to:{" "}
                    <Link
                      href={`/papers/${doc.paper.id}?from=/projects/${doc.projectId}`}
                      className="text-primary hover:underline"
                    >
                      {doc.paper.title}
                    </Link>
                  </span>
                )}
              </p>
            </div>
            {canEdit && (
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>

        {/* Tags */}
        <DocTagsSection
          docId={docId}
          initialTags={tags}
          canEdit={canEdit}
        />

        {/* Editor */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          {canEdit ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing..."
              rows={20}
              className="font-mono text-sm resize-none"
            />
          ) : (
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 bg-transparent p-0">
                {content || "No content yet"}
              </pre>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Comments</h2>

          {/* Add Comment */}
          {currentUserRole && (
            <div className="mb-6">
              <Label htmlFor="new-comment" className="text-gray-900">
                Add a comment
              </Label>
              <Textarea
                id="new-comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="mt-2"
              />
              <Button
                onClick={handleAddComment}
                disabled={isAddingComment || !newComment.trim()}
                className="mt-2"
              >
                {isAddingComment ? "Adding..." : "Add Comment"}
              </Button>
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500">No comments yet</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 bg-gray-50 rounded-md border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-900">
                      {comment.authorName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

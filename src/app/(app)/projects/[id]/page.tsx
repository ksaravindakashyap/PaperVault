"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2, Plus, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CollaborateTab } from "./collaborate-tab";
import { TodosTab } from "./todos-tab";

interface ProjectPaper {
  id: string;
  title: string | null;
  authors: string | null;
  year: number | null;
  venueType: string;
  status: string;
  addedAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  papers: ProjectPaper[];
  createdAt: string;
  updatedAt: string;
}

interface LibraryPaper {
  id: string;
  title: string | null;
  originalFileName: string;
  status: string;
}

const READING_STATUSES = ["TO_READ", "SKIMMED", "DEEP_READ", "INTEGRATED"];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectId, setProjectId] = useState<string>("");
  
  // Unwrap params promise
  useState(() => {
    params.then((p) => setProjectId(p.id));
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddPapersDialogOpen, setIsAddPapersDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [libraryPapers, setLibraryPapers] = useState<LibraryPaper[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());
  const [isAddingPapers, setIsAddingPapers] = useState(false);
  const [removingPaperId, setRemovingPaperId] = useState<string | null>(null);
  const [updatingStatusPaperId, setUpdatingStatusPaperId] = useState<string | null>(null);
  
  // Local state for optimistic updates - maps paperId to status
  const [paperStatusOverrides, setPaperStatusOverrides] = useState<Map<string, string>>(new Map());
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const loadProject = async () => {
    if (!projectId) return;
    try {
      // Load current user
      const userRes = await fetch("/api/me");
      const userData = await userRes.json();
      
      // Load project
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
        setEditName(data.name);
        setEditDescription(data.description || "");
        setEditNotes(data.notes || "");
        
        // Load user's role in project
        if (userData.user) {
          const membersRes = await fetch(`/api/projects/${projectId}/members`);
          if (membersRes.ok) {
            const members = await membersRes.json();
            const member = members.find((m: any) => m.userId === userData.user.id);
            setCurrentUserRole(member?.role || null);
          }
        }
      } else if (response.status === 404) {
        alert("Project not found");
        router.push("/projects");
      } else if (response.status === 403) {
        alert("You don't have access to this project");
        router.push("/projects");
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLibraryPapers = async () => {
    try {
      const response = await fetch("/api/papers");
      if (response.ok) {
        const data = await response.json();
        setLibraryPapers(data);
      }
    } catch (error) {
      console.error("Failed to load library papers:", error);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleUpdateProject = async () => {
    if (!projectId) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription || null,
          notes: editNotes || null,
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        loadProject();
        toast({
          title: "Project updated",
          description: "Your changes have been saved.",
        });
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to update project",
          description: data.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update project",
        description: "An error occurred while updating the project",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Project deleted",
          description: "The project has been permanently deleted.",
        });
        router.push("/projects");
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to delete project",
          description: data.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete project",
        description: "An error occurred while deleting the project",
      });
    }
  };

  const handleOpenAddPapersDialog = () => {
    loadLibraryPapers();
    setIsAddPapersDialogOpen(true);
    setSelectedPaperIds(new Set());
    setSearchTerm("");
  };

  const handleTogglePaperSelection = (paperId: string) => {
    const newSelected = new Set(selectedPaperIds);
    if (newSelected.has(paperId)) {
      newSelected.delete(paperId);
    } else {
      newSelected.add(paperId);
    }
    setSelectedPaperIds(newSelected);
  };

  const handleAddSelectedPapers = async () => {
    if (!projectId) return;
    setIsAddingPapers(true);
    try {
      const promises = Array.from(selectedPaperIds).map((paperId) =>
        fetch(`/api/projects/${projectId}/papers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperId }),
        })
      );

      await Promise.all(promises);
      setIsAddPapersDialogOpen(false);
      loadProject();
      toast({
        title: "Papers added",
        description: `Added ${selectedPaperIds.size} paper${selectedPaperIds.size !== 1 ? 's' : ''} to project.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add papers",
        description: "An error occurred while adding papers to the project",
      });
    } finally {
      setIsAddingPapers(false);
    }
  };

  const handleRemovePaper = async (paperId: string) => {
    if (!projectId) return;
    setRemovingPaperId(paperId);
    try {
      const response = await fetch(`/api/projects/${projectId}/papers/${paperId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadProject();
        toast({
          title: "Paper removed",
          description: "The paper has been removed from the project.",
        });
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to remove paper",
          description: data.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to remove paper",
        description: "An error occurred while removing the paper",
      });
    } finally {
      setRemovingPaperId(null);
    }
  };

  const handleUpdatePaperStatus = async (paperId: string, newStatus: string) => {
    if (!project) return;
    
    // Find the paper's current status
    const paper = project.papers.find(p => p.id === paperId);
    const oldStatus = paper?.status || "";
    
    // Optimistically update the UI
    setUpdatingStatusPaperId(paperId);
    setPaperStatusOverrides(prev => new Map(prev).set(paperId, newStatus));
    
    try {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Clear the override and reload to get fresh data
        setPaperStatusOverrides(prev => {
          const next = new Map(prev);
          next.delete(paperId);
          return next;
        });
        await loadProject();
        toast({
          title: "Status updated",
          description: `Changed to ${newStatus.replace(/_/g, " ")}`,
        });
      } else {
        // Revert the optimistic update
        setPaperStatusOverrides(prev => {
          const next = new Map(prev);
          next.delete(paperId);
          return next;
        });
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to update status",
          description: data.error || "An error occurred",
        });
      }
    } catch (error) {
      // Revert the optimistic update
      setPaperStatusOverrides(prev => {
        const next = new Map(prev);
        next.delete(paperId);
        return next;
      });
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: "An error occurred while updating the paper status",
      });
    } finally {
      setUpdatingStatusPaperId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredLibraryPapers = libraryPapers.filter((paper) => {
    const alreadyInProject = project?.papers.some((p) => p.id === paper.id);
    if (alreadyInProject) return false;
    
    if (!searchTerm) return true;
    
    const title = paper.title || paper.originalFileName;
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getPapersByStatus = (status: string) => {
    if (!project) return [];
    
    // Apply optimistic updates
    return project.papers.filter((p) => {
      const effectiveStatus = paperStatusOverrides.get(p.id) || p.status;
      return effectiveStatus === status;
    });
  };
  
  // Get effective status for a paper (considering optimistic updates)
  const getEffectiveStatus = (paperId: string, currentStatus: string) => {
    return paperStatusOverrides.get(paperId) || currentStatus;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <Link
            href="/projects"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
          {project.description && (
            <p className="text-gray-600">{project.description}</p>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="papers" className="w-full">
          <TabsList>
            <TabsTrigger value="papers">Papers ({project.papers.length})</TabsTrigger>
            <TabsTrigger value="queue">Reading Queue</TabsTrigger>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="collaborate">Collaborate</TabsTrigger>
          </TabsList>

          {/* Papers Tab */}
          <TabsContent value="papers" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Papers in Project</h2>
              <Button onClick={handleOpenAddPapersDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Papers
              </Button>
            </div>

            {project.papers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">No papers in this project yet</p>
                <Button onClick={handleOpenAddPapersDialog}>Add your first paper</Button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Venue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Added
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {project.papers.map((paper) => (
                      <tr key={paper.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <Link
                            href={`/papers/${paper.id}?from=/projects/${projectId}`}
                            className="text-sm text-gray-900 hover:text-primary"
                          >
                            {paper.title || "Untitled"}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {paper.venueType.replace(/_/g, " ")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {paper.year || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {paper.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(paper.addedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleRemovePaper(paper.id)}
                            disabled={removingPaperId === paper.id}
                            className="text-red-600 hover:text-red-700 disabled:opacity-50"
                            title="Remove from project"
                          >
                            {removingPaperId === paper.id ? (
                              <span className="text-xs">Removing...</span>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Reading Queue Tab */}
          <TabsContent value="queue" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Reading Queue</h2>
            
            {project.papers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">No papers in this project yet</p>
                <Button onClick={handleOpenAddPapersDialog}>Add papers to get started</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {READING_STATUSES.map((status) => {
                  const papers = getPapersByStatus(status);
                  return (
                    <div key={status} className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="font-semibold mb-3 text-gray-900">
                        {status.replace(/_/g, " ")} ({papers.length})
                      </h3>
                      {papers.length === 0 ? (
                        <p className="text-sm text-gray-500">No papers in this stage</p>
                      ) : (
                        <div className="space-y-2">
                          {papers.map((paper) => {
                            const effectiveStatus = getEffectiveStatus(paper.id, paper.status);
                            return (
                              <div
                                key={paper.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                              >
                                <div className="flex-1 min-w-0">
                                  <Link
                                    href={`/papers/${paper.id}?from=/projects/${projectId}`}
                                    className="text-sm font-medium text-gray-900 hover:text-primary"
                                  >
                                    {paper.title || "Untitled"}
                                  </Link>
                                  <p className="text-xs text-gray-500 mt-1 truncate">
                                    {paper.authors && paper.authors.substring(0, 100)}
                                    {paper.year && ` • ${paper.year}`}
                                  </p>
                                </div>
                                <Select
                                  value={effectiveStatus}
                                  onValueChange={(newStatus) =>
                                    handleUpdatePaperStatus(paper.id, newStatus)
                                  }
                                  disabled={updatingStatusPaperId === paper.id}
                                >
                                  <SelectTrigger 
                                    className="w-[180px] ml-4 flex-shrink-0"
                                    aria-label={`Change status for ${paper.title || 'paper'}`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {READING_STATUSES.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {s.replace(/_/g, " ")}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Show papers with non-reading statuses */}
                {(() => {
                  const nonReadingPapers = project.papers.filter(p => {
                    const effectiveStatus = paperStatusOverrides.get(p.id) || p.status;
                    return !READING_STATUSES.includes(effectiveStatus);
                  });
                  
                  if (nonReadingPapers.length === 0) return null;
                  
                  return (
                    <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
                      <h3 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                        <span className="text-amber-600">⚠</span>
                        Unassigned Papers ({nonReadingPapers.length})
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        These papers haven't been assigned a reading status yet. Set their status to add them to your reading queue.
                      </p>
                      <div className="space-y-2">
                        {nonReadingPapers.map((paper) => {
                          const effectiveStatus = getEffectiveStatus(paper.id, paper.status);
                          return (
                            <div
                              key={paper.id}
                              className="flex items-center justify-between p-3 bg-white rounded-md border border-amber-200"
                            >
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/papers/${paper.id}?from=/projects/${projectId}`}
                                  className="text-sm font-medium text-gray-900 hover:text-primary"
                                >
                                  {paper.title || "Untitled"}
                                </Link>
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  Current status: {effectiveStatus.replace(/_/g, " ")}
                                  {paper.authors && ` • ${paper.authors.substring(0, 80)}`}
                                  {paper.year && ` • ${paper.year}`}
                                </p>
                              </div>
                              <Select
                                value={effectiveStatus}
                                onValueChange={(newStatus) =>
                                  handleUpdatePaperStatus(paper.id, newStatus)
                                }
                                disabled={updatingStatusPaperId === paper.id}
                              >
                                <SelectTrigger 
                                  className="w-[180px] ml-4 flex-shrink-0"
                                  aria-label={`Change status for ${paper.title || 'paper'}`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {READING_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s.replace(/_/g, " ")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Project Notes</h2>
                <Button onClick={handleUpdateProject} disabled={isUpdating} size="sm">
                  {isUpdating ? "Saving..." : "Save Notes"}
                </Button>
              </div>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Write your project notes here..."
                rows={15}
                className="font-mono text-sm"
                maxLength={100000}
              />
              <p className="text-xs text-gray-500 mt-2">
                {editNotes.length} / 100,000 characters
              </p>
            </div>
          </TabsContent>

          {/* Todos Tab */}
          <TabsContent value="todos" className="mt-6">
            <TodosTab projectId={projectId} currentUserRole={currentUserRole} />
          </TabsContent>

          {/* Collaborate Tab */}
          <TabsContent value="collaborate" className="mt-6">
            <CollaborateTab projectId={projectId} currentUserRole={currentUserRole} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                maxLength={2000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProject} disabled={isUpdating || !editName.trim()}>
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project &ldquo;{project.name}&rdquo;. Papers in this
              project will remain in your library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Papers Dialog */}
      <Dialog open={isAddPapersDialogOpen} onOpenChange={setIsAddPapersDialogOpen}>
        <DialogContent className="max-w-2xl bg-white text-gray-900 border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add Papers to Project</DialogTitle>
            <DialogDescription className="text-gray-600">
              Select papers from your library to add to this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Search papers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white"
            />
            <div className="max-h-96 overflow-y-auto border rounded-md bg-white">
              {filteredLibraryPapers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm
                    ? "No papers match your search"
                    : "All library papers are already in this project"}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredLibraryPapers.map((paper) => (
                    <label
                      key={paper.id}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPaperIds.has(paper.id)}
                        onChange={() => handleTogglePaperSelection(paper.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        aria-label={`Select ${paper.title || paper.originalFileName}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {paper.title || paper.originalFileName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Status: {paper.status.replace(/_/g, " ")}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddPapersDialogOpen(false)}
              disabled={isAddingPapers}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSelectedPapers}
              disabled={isAddingPapers || selectedPaperIds.size === 0}
            >
              {isAddingPapers
                ? "Adding..."
                : `Add ${selectedPaperIds.size} Paper${selectedPaperIds.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Workspace {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface WorkspaceSwitcherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkspaceSwitcherDialog({
  open,
  onOpenChange,
}: WorkspaceSwitcherDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open) {
      loadWorkspaces();
    }
  }, [open]);

  const loadWorkspaces = async () => {
    setIsLoading(true);
    try {
      const [currentRes, listRes] = await Promise.all([
        fetch("/api/workspaces/current"),
        fetch("/api/workspaces/list"),
      ]);

      if (currentRes.ok && listRes.ok) {
        const currentData = await currentRes.json();
        const listData = await listRes.json();

        setWorkspaces(listData.workspaces || []);
        if (currentData.workspace) {
          setCurrentWorkspaceId(currentData.workspace.id);
        } else if (listData.workspaces.length > 0) {
          setCurrentWorkspaceId(listData.workspaces[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load workspaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitch = async () => {
    if (!currentWorkspaceId) {
      toast({
        variant: "destructive",
        title: "No workspace selected",
        description: "Please select a workspace",
      });
      return;
    }

    try {
      const response = await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: currentWorkspaceId }),
      });

      if (response.ok) {
        const selected = workspaces.find((w) => w.id === currentWorkspaceId);
        toast({
          title: "Workspace switched",
          description: `Switched to ${selected?.name || "workspace"}`,
        });
        window.dispatchEvent(new CustomEvent("workspaceChanged"));
        onOpenChange(false);
        router.refresh();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to switch workspace");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to switch workspace",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleCreate = async () => {
    if (!newWorkspaceName.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid name",
        description: "Please enter a workspace name",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Workspace created",
          description: `Created ${data.name}`,
        });
        setNewWorkspaceName("");
        setShowCreate(false);
        await loadWorkspaces();
        setCurrentWorkspaceId(data.id);
        window.dispatchEvent(new CustomEvent("workspaceChanged"));
        onOpenChange(false);
        router.refresh();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create workspace");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create workspace",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white text-gray-900 border border-gray-200 shadow-lg max-w-md">
        <DialogHeader>
          <DialogTitle>Switch Workspace</DialogTitle>
          <DialogDescription>
            Switch to a different workspace or create a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!showCreate ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="workspace-select">Select Workspace</Label>
                {isLoading ? (
                  <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
                ) : (
                  <Select
                    value={currentWorkspaceId}
                    onValueChange={setCurrentWorkspaceId}
                  >
                    <SelectTrigger id="workspace-select" className="w-full">
                      <SelectValue placeholder="Select a workspace" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {workspaces.map((workspace) => (
                        <SelectItem key={workspace.id} value={workspace.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <span>{workspace.name}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({workspace.role})
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSwitch}
                  disabled={!currentWorkspaceId || isLoading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Switch
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreate(true)}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="My Workspace"
                  disabled={isCreating}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newWorkspaceName.trim()) {
                      handleCreate();
                    }
                  }}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !newWorkspaceName.trim()}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isCreating ? "Creating..." : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreate(false);
                    setNewWorkspaceName("");
                  }}
                  disabled={isCreating}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

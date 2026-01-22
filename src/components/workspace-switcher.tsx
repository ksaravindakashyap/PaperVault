"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Workspace {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
}

export function WorkspaceSwitcher() {
  const router = useRouter();
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
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
          const active = listData.workspaces.find(
            (w: Workspace) => w.id === currentData.workspace.id
          );
          setCurrentWorkspace(active || currentData.workspace);
        } else if (listData.workspaces.length > 0) {
          setCurrentWorkspace(listData.workspaces[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load workspaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkspaceChange = async (workspaceId: string) => {
    if (workspaceId === "create") {
      router.push("/onboarding");
      return;
    }

    try {
      const response = await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });

      if (response.ok) {
        const selected = workspaces.find((w) => w.id === workspaceId);
        if (selected) {
          setCurrentWorkspace(selected);
          // Update isActive flags
          setWorkspaces((prev) =>
            prev.map((w) => ({
              ...w,
              isActive: w.id === workspaceId,
            }))
          );
          toast({
            title: "Workspace switched",
            description: `Switched to ${selected.name}`,
          });
          // Trigger a custom event to notify header to refresh
          window.dispatchEvent(new CustomEvent("workspaceChanged"));
          router.refresh();
        }
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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/onboarding")}
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Workspace
      </Button>
    );
  }

  return (
    <Select
      value={currentWorkspace.id}
      onValueChange={handleWorkspaceChange}
    >
      <SelectTrigger className="w-[200px] h-9">
        <SelectValue>
          <span className="font-medium">{currentWorkspace.name}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-white">
        {workspaces.map((workspace) => (
          <SelectItem
            key={workspace.id}
            value={workspace.id}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2 flex-1">
              <span>{workspace.name}</span>
              <span className="text-xs text-gray-500">({workspace.role})</span>
            </div>
            {workspace.isActive && (
              <Check className="w-4 h-4 text-primary ml-2" />
            )}
          </SelectItem>
        ))}
        <SelectItem value="create" className="text-primary">
          <Plus className="w-4 h-4 mr-2 inline" />
          Create New Workspace
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

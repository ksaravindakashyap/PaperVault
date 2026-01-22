"use client";

import { useState, useEffect } from "react";
import { TagsInput } from "@/components/tags-input";
import { useToast } from "@/hooks/use-toast";

interface Tag {
  id: string;
  name: string;
}

interface TagsSectionProps {
  paperId: string;
  initialTags: Tag[];
  canEdit: boolean;
}

export function TagsSection({ paperId, initialTags, canEdit }: TagsSectionProps) {
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>(initialTags);

  const handleAdd = async (tagName: string) => {
    try {
      const response = await fetch(`/api/papers/${paperId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagName }),
      });

      if (response.ok) {
        const data = await response.json();
        setTags([...tags, data.tag]);
        toast({
          title: "Tag added",
          description: `Added tag "${data.tag.name}"`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add tag");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add tag",
        description: error instanceof Error ? error.message : "An error occurred",
      });
      throw error;
    }
  };

  const handleRemove = async (tagId: string) => {
    const tagToRemove = tags.find((t) => t.id === tagId);
    if (!tagToRemove) return;

    try {
      const response = await fetch(`/api/papers/${paperId}/tags/${tagId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTags(tags.filter((t) => t.id !== tagId));
        toast({
          title: "Tag removed",
          description: `Removed tag "${tagToRemove.name}"`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove tag");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to remove tag",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
      <TagsInput
        tags={tags}
        onAdd={handleAdd}
        onRemove={handleRemove}
        canEdit={canEdit}
        entityType="paper"
        entityId={paperId}
      />
    </div>
  );
}

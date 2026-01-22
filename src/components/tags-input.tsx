"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Tag {
  id: string;
  name: string;
}

interface TagsInputProps {
  tags: Tag[];
  onAdd: (tagName: string) => Promise<void>;
  onRemove: (tagId: string) => Promise<void>;
  canEdit?: boolean;
  entityType: "paper" | "doc";
  entityId: string;
}

export function TagsInput({
  tags,
  onAdd,
  onRemove,
  canEdit = true,
  entityType,
  entityId,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced autocomplete
  useEffect(() => {
    if (!inputValue.trim() || !canEdit) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tags?q=${encodeURIComponent(inputValue)}`);
        if (response.ok) {
          const data = await response.json();
          // Filter out tags already added
          const filtered = data.filter(
            (tag: Tag) => !tags.some((t) => t.id === tag.id)
          );
          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        }
      } catch (error) {
        console.error("Failed to fetch tag suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, tags, canEdit]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddTag = async (tagName?: string) => {
    const tagToAdd = tagName || inputValue.trim();
    if (!tagToAdd || isAdding) return;

    setIsAdding(true);
    try {
      await onAdd(tagToAdd);
      setInputValue("");
      setShowSuggestions(false);
    } catch (error) {
      console.error("Failed to add tag:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (tag: Tag) => {
    handleAddTag(tag.name);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-sm"
          >
            <span>{tag.name}</span>
            {canEdit && (
              <button
                onClick={() => onRemove(tag.id)}
                className="hover:bg-orange-200 rounded p-0.5 transition-colors"
                aria-label={`Remove tag ${tag.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="relative">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Add a tag..."
              className="flex-1"
              disabled={isAdding}
            />
            <Button
              onClick={() => handleAddTag()}
              disabled={!inputValue.trim() || isAdding}
              size="sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
            >
              {suggestions.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleSuggestionClick(tag)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="absolute right-12 top-2 text-gray-400 text-sm">
              Searching...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

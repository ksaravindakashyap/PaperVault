"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserInitDialogProps {
  open: boolean;
  onClose: () => void;
}

export function UserInitDialog({ open, onClose }: UserInitDialogProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/me/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (response.ok) {
        onClose();
        // Re-check user instead of full reload
        // The cookie is set, so next check will find the user
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        const data = await response.json();
        alert(`Failed to set name: ${data.error}`);
      }
    } catch (error) {
      alert("Failed to set name");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-white text-gray-900 border border-gray-200 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Welcome to PaperVault</DialogTitle>
          <DialogDescription className="text-gray-600">
            Please set your display name to get started. This will be used to identify you in projects.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-900">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={200}
              className="bg-white"
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  handleSubmit();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? "Setting..." : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

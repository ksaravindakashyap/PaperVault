"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface InviteInfo {
  id: string;
  project: {
    id: string;
    name: string;
    description: string | null;
  };
  role: string;
  expiresAt: string | null;
}

export default function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [token, setToken] = useState<string>("");
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [name, setName] = useState("");
  const [needsName, setNeedsName] = useState(false);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;

    const loadInvite = async () => {
      try {
        const response = await fetch(`/api/invites/${token}`);
        if (response.ok) {
          const data = await response.json();
          setInvite(data);

          // Check if user exists
          const userRes = await fetch("/api/me");
          const userData = await userRes.json();
          if (!userData.user) {
            setNeedsName(true);
          }
        } else if (response.status === 404) {
          toast({
            variant: "destructive",
            title: "Invite not found",
            description: "This invite link is invalid",
          });
        } else if (response.status === 410) {
          toast({
            variant: "destructive",
            title: "Invite expired",
            description: "This invite link has expired",
          });
        }
      } catch (error) {
        console.error("Failed to load invite:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load invite",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInvite();
  }, [token, toast]);

  const handleAccept = async () => {
    if (!token) return;
    if (needsName && !name.trim()) return;

    setIsAccepting(true);
    try {
      const response = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: needsName ? name.trim() : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success!",
          description: "You've been added to the project",
        });
        router.push(`/projects/${data.projectId}`);
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to accept invite",
          description: data.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to accept invite",
        description: "An error occurred",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Loading invite...</div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invalid Invite
          </h1>
          <p className="text-gray-600 mb-6">
            This invite link is invalid or has expired.
          </p>
          <Button onClick={() => router.push("/projects")}>
            Go to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Project Invitation
          </h1>

          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">You've been invited to:</p>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {invite.project.name}
            </h2>
            {invite.project.description && (
              <p className="text-sm text-gray-600 mb-4">
                {invite.project.description}
              </p>
            )}
            <p className="text-sm text-gray-500">
              Role: <span className="font-medium">{invite.role.replace(/_/g, " ")}</span>
            </p>
          </div>

          {needsName && (
            <div className="mb-6">
              <Label htmlFor="name" className="text-gray-900">
                Your Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) {
                    handleAccept();
                  }
                }}
                autoFocus
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={isAccepting || (needsName && !name.trim())}
              className="flex-1"
            >
              {isAccepting ? "Accepting..." : "Accept Invitation"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/projects")}
              disabled={isAccepting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [inviteToken, setInviteToken] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [invitePreview, setInvitePreview] = useState<{
    workspaceName: string;
    role: string;
    expiresAt: string;
    isExpired: boolean;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const debouncedToken = useDebounce(inviteToken, 500);

  // Extract token from URL if present
  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setInviteToken(tokenFromUrl);
    }
  }, [searchParams]);

  // Load invite preview when token changes
  useEffect(() => {
    if (!debouncedToken.trim()) {
      setInvitePreview(null);
      return;
    }

    // Extract token from full URL if pasted
    let token = debouncedToken.trim();
    const urlMatch = token.match(/[?&]token=([^&]+)/);
    if (urlMatch) {
      token = urlMatch[1];
    }

    setIsLoadingPreview(true);
    fetch(`/api/workspaces/invites/${token}`)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        if (res.status === 404) {
          setInvitePreview(null);
          return null;
        }
        throw new Error("Failed to load invite");
      })
      .then((data) => {
        if (data) {
          setInvitePreview(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load invite preview:", error);
        setInvitePreview(null);
      })
      .finally(() => {
        setIsLoadingPreview(false);
      });
  }, [debouncedToken]);

  const handleJoin = async () => {
    if (!inviteToken.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid invite",
        description: "Please enter an invite token or link",
      });
      return;
    }

    // Extract token from full URL if pasted
    let token = inviteToken.trim();
    const urlMatch = token.match(/[?&]token=([^&]+)/);
    if (urlMatch) {
      token = urlMatch[1];
    }

    setIsJoining(true);
    try {
      const response = await fetch("/api/workspaces/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Joined workspace",
          description: `You've joined ${data.workspaceName}`,
        });
        router.push("/library");
        router.refresh();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join workspace");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to join workspace",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreate = async () => {
    if (!workspaceName.trim()) {
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
        body: JSON.stringify({ name: workspaceName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Workspace created",
          description: `Created ${data.name}`,
        });
        router.push("/library");
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to PaperVault
          </h1>
          <p className="text-gray-600">
            Join an existing workspace or create your own
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Join Workspace Card */}
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-5 h-5 text-primary" />
                <CardTitle>Join Workspace</CardTitle>
              </div>
              <CardDescription>
                Enter an invite link or token to join an existing workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-token">Invite link or token</Label>
                <Input
                  id="invite-token"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                  placeholder="Paste invite link or token here..."
                  disabled={isJoining}
                />
              </div>

              {/* Invite Preview */}
              {isLoadingPreview && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading invite details...
                </div>
              )}

              {invitePreview && !isLoadingPreview && (
                <div
                  className={`p-3 rounded-md border ${
                    invitePreview.isExpired
                      ? "bg-red-50 border-red-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {invitePreview.workspaceName}
                    </p>
                    <p className="text-gray-600 mt-1">
                      Role: {invitePreview.role}
                    </p>
                    {invitePreview.isExpired ? (
                      <p className="text-red-600 mt-1 font-medium">
                        This invite has expired
                      </p>
                    ) : (
                      <p className="text-gray-500 mt-1">
                        Expires:{" "}
                        {new Date(invitePreview.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleJoin}
                disabled={
                  isJoining ||
                  !inviteToken.trim() ||
                  (invitePreview?.isExpired ?? false)
                }
                className="w-full"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Workspace"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Create Workspace Card */}
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-5 h-5 text-primary" />
                <CardTitle>Create Workspace</CardTitle>
              </div>
              <CardDescription>
                Start a new workspace for your research team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace name</Label>
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="My Research Workspace"
                  disabled={isCreating}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && workspaceName.trim()) {
                      handleCreate();
                    }
                  }}
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={isCreating || !workspaceName.trim()}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Workspace"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

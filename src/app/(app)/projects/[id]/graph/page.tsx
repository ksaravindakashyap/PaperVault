"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";

interface GraphNode {
  id: string;
  kind: "project" | "paper" | "tag";
  label: string;
  meta?: Record<string, unknown>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: "contains" | "tagged" | "cites";
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function ProjectGraphPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showCitationEdges, setShowCitationEdges] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load project info and graph data
  useEffect(() => {
    if (!projectId) return;

    setIsLoading(true);
    
    // Load project name
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.name) {
          setProjectName(data.name);
        }
      })
      .catch(console.error);

    // Load graph data
    fetch(`/api/graph?scope=project&projectId=${projectId}`)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("Failed to load graph");
      })
      .then((data) => {
        setGraphData(data);
      })
      .catch((error) => {
        console.error("Failed to load graph:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [projectId]);

  // Convert graph data to ReactFlow format
  useEffect(() => {
    if (!graphData) return;

    const flowNodes: Node[] = graphData.nodes.map((node) => {
      let position = { x: 0, y: 0 };
      let style: Record<string, unknown> = {};
      let data: Record<string, unknown> = { label: node.label, kind: node.kind };

      if (node.kind === "project") {
        position = { x: 400, y: 300 };
        style = {
          background: "#f97316",
          color: "#fff",
          border: "2px solid #ea580c",
          borderRadius: "8px",
          padding: "12px",
          fontSize: "16px",
          fontWeight: "bold",
          width: 200,
        };
      } else if (node.kind === "paper") {
        style = {
          background: "#fff",
          color: "#1f2937",
          border: "2px solid #e5e7eb",
          borderRadius: "6px",
          padding: "8px",
          fontSize: "14px",
          width: 180,
        };
        data = {
          ...data,
          meta: node.meta,
          onClick: () => setSelectedNode(node),
        };
      } else if (node.kind === "tag") {
        style = {
          background: "#fed7aa",
          color: "#9a3412",
          border: "2px solid #fb923c",
          borderRadius: "4px",
          padding: "6px",
          fontSize: "12px",
          width: 120,
        };
        data = {
          ...data,
          onClick: () => setSelectedNode(node),
        };
      }

      return {
        id: node.id,
        type: "default",
        position,
        data,
        style,
      };
    });

    // Layout: project in center, papers around it, tags on outer ring
    const projectNode = flowNodes.find((n) => n.data.kind === "project");
    const paperNodes = flowNodes.filter((n) => n.data.kind === "paper");
    const tagNodes = flowNodes.filter((n) => n.data.kind === "tag");

    if (projectNode) {
      const centerX = projectNode.position.x;
      const centerY = projectNode.position.y;
      const radius = 200;

      // Position papers in a circle around project
      paperNodes.forEach((node, index) => {
        const angle = (index / paperNodes.length) * 2 * Math.PI;
        node.position = {
          x: centerX + radius * Math.cos(angle) - 90,
          y: centerY + radius * Math.sin(angle) - 30,
        };
      });

      // Position tags further out
      tagNodes.forEach((node, index) => {
        const angle = (index / tagNodes.length) * 2 * Math.PI;
        node.position = {
          x: centerX + (radius * 1.8) * Math.cos(angle) - 60,
          y: centerY + (radius * 1.8) * Math.sin(angle) - 15,
        };
      });
    }

    const flowEdges: Edge[] = graphData.edges
      .filter((edge) => {
        if (edge.kind === "cites" && !showCitationEdges) {
          return false;
        }
        return true;
      })
      .map((edge) => {
        let style: Record<string, unknown> = {};
        let animated = false;

        if (edge.kind === "contains") {
          style = { stroke: "#f97316", strokeWidth: 2 };
        } else if (edge.kind === "tagged") {
          style = { stroke: "#fb923c", strokeWidth: 1.5, strokeDasharray: "5,5" };
        } else if (edge.kind === "cites") {
          style = { stroke: "#60a5fa", strokeWidth: 1 };
          animated = true;
        }

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          style,
          animated,
        };
      });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [graphData, showCitationEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const graphNode = graphData?.nodes.find((n) => n.id === node.id);
    if (graphNode) {
      setSelectedNode(graphNode);
    }
  }, [graphData]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Loading graph...</div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Failed to load graph</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Link>
          <div>
            <div className="text-xs text-gray-500 mb-1">
              Projects / {projectName || "Loading..."} / Graph
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              {projectName ? `${projectName} Graph` : "Project Graph"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showCitationEdges}
              onChange={(e) => setShowCitationEdges(e.target.checked)}
              className="rounded"
            />
            Show citations
          </label>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          connectionMode={ConnectionMode.Loose}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>

        {/* Side Panel */}
        {selectedNode && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-lg overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Details</h2>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Type</p>
                <p className="font-medium text-gray-900 capitalize">{selectedNode.kind}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Label</p>
                <p className="text-gray-900">{selectedNode.label}</p>
              </div>
              {selectedNode.kind === "paper" && selectedNode.meta && (
                <>
                  {selectedNode.meta.venueType && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Venue</p>
                      <p className="text-gray-900">{String(selectedNode.meta.venueType)}</p>
                    </div>
                  )}
                  {selectedNode.meta.year && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Year</p>
                      <p className="text-gray-900">{String(selectedNode.meta.year)}</p>
                    </div>
                  )}
                  <Button asChild className="w-full">
                    <Link href={`/papers/${selectedNode.id}`}>Open Paper</Link>
                  </Button>
                </>
              )}
              {selectedNode.kind === "project" && selectedNode.meta && (
                <>
                  {selectedNode.meta.description && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Description</p>
                      <p className="text-gray-900">{String(selectedNode.meta.description)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Papers</p>
                    <p className="text-gray-900">{String(selectedNode.meta.paperCount || 0)}</p>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={`/projects/${selectedNode.id}`}>Open Project</Link>
                  </Button>
                </>
              )}
              {selectedNode.kind === "tag" && (
                <Button asChild className="w-full" variant="outline">
                  <Link href={`/search?tag=${encodeURIComponent(selectedNode.label)}`}>
                    Search for this tag
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

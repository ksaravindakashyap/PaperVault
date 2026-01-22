"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X, Info } from "lucide-react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/demo/demo-provider";

interface GraphNode {
  id: string;
  kind: "project" | "paper" | "tag";
  label: string;
  meta?: any;
}

export default function DemoProjectGraphPage() {
  const params = useParams();
  const { id } = params;
  const { getProject, getPapers, getPaperTags, getTags } = useDemo();
  const [project, setProject] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showCitationEdges, setShowCitationEdges] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (id && typeof id === "string") {
      const projectData = getProject(id);
      if (projectData) {
        setProject(projectData);

        const allPapers = getPapers();
        const projectPapers = allPapers.filter((p) =>
          projectData.paperIds?.includes(p.id)
        );

        // Build graph nodes
        const graphNodes: GraphNode[] = [];
        const graphEdges: any[] = [];

        // Add project node
        graphNodes.push({
          id: projectData.id,
          kind: "project",
          label: projectData.name,
          meta: {
            description: projectData.description,
            paperCount: projectPapers.length,
          },
        });

        // Add paper nodes and project-paper edges
        projectPapers.forEach((paper) => {
          graphNodes.push({
            id: paper.id,
            kind: "paper",
            label: paper.title,
            meta: {
              venueType: paper.venueType,
              year: paper.year,
              status: paper.status,
            },
          });

          graphEdges.push({
            id: `${projectData.id}-${paper.id}`,
            source: projectData.id,
            target: paper.id,
            kind: "contains",
          });
        });

        // Add tag nodes and paper-tag edges
        const allTags = new Map<string, any>();
        projectPapers.forEach((paper) => {
          const paperTags = getPaperTags(paper.id);
          paperTags.forEach((tag) => {
            if (!allTags.has(tag.id)) {
              allTags.set(tag.id, tag);
            }

            graphEdges.push({
              id: `${paper.id}-${tag.id}`,
              source: paper.id,
              target: tag.id,
              kind: "tagged",
            });
          });
        });

        allTags.forEach((tag) => {
          graphNodes.push({
            id: tag.id,
            kind: "tag",
            label: tag.name,
          });
        });

        // Convert to ReactFlow format
        const flowNodes: Node[] = graphNodes.map((node) => {
          let position = { x: 0, y: 0 };
          let style: any = {};
          let data: any = { label: node.label, kind: node.kind };

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
          }

          return {
            id: node.id,
            type: "default",
            position,
            data,
            style,
            draggable: false, // Disable dragging in demo mode
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

        const flowEdges: Edge[] = graphEdges.map((edge) => {
          let style: any = {};
          let animated = false;

          if (edge.kind === "contains") {
            style = { stroke: "#f97316", strokeWidth: 2 };
          } else if (edge.kind === "tagged") {
            style = { stroke: "#fb923c", strokeWidth: 1.5, strokeDasharray: "5,5" };
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
      }
    }
  }, [id, getProject, getPapers, getPaperTags, setNodes, setEdges]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const graphNode: GraphNode = {
      id: node.id,
      kind: node.data.kind,
      label: node.data.label,
      meta: node.data.meta,
    };
    setSelectedNode(graphNode);
  }, []);

  if (!project) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-500">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/demo/projects/${id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Link>
          <div>
            <div className="text-xs text-gray-500 mb-1">
              Projects / {project.name} / Graph
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              {project.name} Graph
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md text-orange-700 text-sm">
            <Info className="w-4 h-4" />
            <span>Demo mode: read-only</span>
          </div>
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
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          fitView
        >
          <Background />
          <Controls showInteractive={false} />
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
                      <p className="text-gray-900">{selectedNode.meta.venueType.replace(/_/g, " ")}</p>
                    </div>
                  )}
                  {selectedNode.meta.year && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Year</p>
                      <p className="text-gray-900">{selectedNode.meta.year}</p>
                    </div>
                  )}
                  {selectedNode.meta.status && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <p className="text-gray-900">{selectedNode.meta.status.replace(/_/g, " ")}</p>
                    </div>
                  )}
                  <Button asChild className="w-full">
                    <Link href={`/demo/papers/${selectedNode.id}`}>Open Paper</Link>
                  </Button>
                </>
              )}
              {selectedNode.kind === "project" && selectedNode.meta && (
                <>
                  {selectedNode.meta.description && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Description</p>
                      <p className="text-gray-900">{selectedNode.meta.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Papers</p>
                    <p className="text-gray-900">{selectedNode.meta.paperCount || 0}</p>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={`/demo/projects/${selectedNode.id}`}>Open Project</Link>
                  </Button>
                </>
              )}
              {selectedNode.kind === "tag" && (
                <Button asChild className="w-full" variant="outline">
                  <Link href={`/demo/search?q=${encodeURIComponent(selectedNode.label)}`}>
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

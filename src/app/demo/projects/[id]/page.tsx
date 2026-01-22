"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { useDemo } from "@/demo/demo-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const READING_STATUSES = ["TO_READ", "SKIMMED", "DEEP_READ", "INTEGRATED"];

export default function DemoProjectDetailPage() {
  const params = useParams();
  const { id } = params;
  const { getProject, getPapers, getDocs, getTodos } = useDemo();
  const [project, setProject] = useState<any>(null);
  const [papers, setPapers] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [todosFilter, setTodosFilter] = useState<"all" | "week">("all");

  useEffect(() => {
    if (id && typeof id === "string") {
      const projectData = getProject(id);
      if (projectData) {
        setProject(projectData);
        const allPapers = getPapers();
        setPapers(
          allPapers.filter((p) => projectData.paperIds?.includes(p.id))
        );
        setDocs(getDocs(id));
        setTodos(getTodos(id));
      }
    }
  }, [id, getProject, getPapers, getDocs, getTodos]);

  if (!project) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-500">Project not found</p>
        </div>
      </div>
    );
  }

  const getPapersByStatus = (status: string) => {
    return papers.filter((p) => p.status === status);
  };

  const getFilteredTodos = () => {
    if (todosFilter === "week") {
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      return todos.filter((t) => {
        const dueDate = new Date(t.dueDate);
        return dueDate <= oneWeekFromNow && t.status === "OPEN";
      });
    }
    return todos;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PROCESSING: "bg-primary-100 text-primary-700",
      READY: "bg-green-100 text-green-700",
      FAILED: "bg-red-100 text-red-700",
      TO_READ: "bg-blue-100 text-blue-700",
      SKIMMED: "bg-yellow-100 text-yellow-700",
      DEEP_READ: "bg-purple-100 text-purple-700",
      INTEGRATED: "bg-indigo-100 text-indigo-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}
      >
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/demo/projects"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-gray-600 mb-4">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/demo/projects/${id}/graph`}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                Graph
              </Link>
            </Button>
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md text-orange-700 text-sm">
              <Info className="w-4 h-4" />
              <span>Demo mode: read-only</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="papers" className="w-full">
          <TabsList>
            <TabsTrigger value="papers">Papers ({papers.length})</TabsTrigger>
            <TabsTrigger value="queue">Reading Queue</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="todos">Todos ({todos.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="papers" className="mt-6">
            {papers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No papers in this project</p>
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {papers.map((paper) => (
                      <tr key={paper.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <Link
                            href={`/demo/papers/${paper.id}`}
                            className="text-sm text-gray-900 hover:text-primary"
                          >
                            {paper.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {paper.venueType.replace(/_/g, " ")}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {paper.year}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(paper.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="queue" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Reading Queue</h2>
            
            {papers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No papers in this project yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {READING_STATUSES.map((status) => {
                  const statusPapers = getPapersByStatus(status);
                  return (
                    <div key={status} className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="font-semibold mb-3 text-gray-900">
                        {status.replace(/_/g, " ")} ({statusPapers.length})
                      </h3>
                      {statusPapers.length === 0 ? (
                        <p className="text-sm text-gray-500">No papers in this stage</p>
                      ) : (
                        <div className="space-y-2">
                          {statusPapers.map((paper) => (
                            <div
                              key={paper.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                            >
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/demo/papers/${paper.id}`}
                                  className="text-sm font-medium text-gray-900 hover:text-primary"
                                >
                                  {paper.title}
                                </Link>
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  {paper.authors && paper.authors.substring(0, 100)}
                                  {paper.year && ` • ${paper.year}`}
                                </p>
                              </div>
                              <span className="ml-4 px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded cursor-not-allowed" title="Demo mode: status changes disabled">
                                {status.replace(/_/g, " ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Project Notes</h2>
                <span className="text-sm text-gray-500">Read-only in demo mode</span>
              </div>
              {project.notes ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-md">
                    {project.notes}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No notes for this project yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    In the full app, you can write and edit project notes here
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="todos" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Todos</h2>
              <div className="flex gap-2">
                <Button
                  variant={todosFilter === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTodosFilter("week")}
                >
                  This Week
                </Button>
                <Button
                  variant={todosFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTodosFilter("all")}
                >
                  All Time
                </Button>
              </div>
            </div>

            {getFilteredTodos().length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  {todosFilter === "week"
                    ? "No todos due this week"
                    : "No todos in this project"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredTodos().map((todo) => (
                  <div
                    key={todo.id}
                    className="bg-white rounded-lg border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {todo.title}
                        </h3>
                        {todo.notes && (
                          <p className="text-sm text-gray-600 mb-2">
                            {todo.notes}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Due: {new Date(todo.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          todo.status === "DONE"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {todo.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

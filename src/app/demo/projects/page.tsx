"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDemo } from "@/demo/demo-provider";
import { Info } from "lucide-react";

export default function DemoProjectsPage() {
  const { getProjects } = useDemo();
  const [projects, setProjects] = useState<Array<{ id: string; name: string; description?: string; paperIds?: string[]; docIds?: string[]; todoIds?: string[]; updatedAt: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const demoProjects = getProjects();
    setProjects(demoProjects);
    setIsLoading(false);
  }, [getProjects]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md text-orange-700 text-sm">
            <Info className="w-4 h-4" />
            <span>Demo mode: read-only</span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No projects in demo dataset</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/demo/projects/${project.id}`}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{project.paperIds?.length || 0} papers</span>
                  <span>{project.docIds?.length || 0} docs</span>
                  <span>{project.todoIds?.length || 0} todos</span>
                </div>
                <div className="mt-4 text-xs text-gray-400">
                  Updated {formatDate(project.updatedAt)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

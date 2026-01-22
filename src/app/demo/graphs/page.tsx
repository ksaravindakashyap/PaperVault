"use client";

import { useState, useEffect } from "react";
import { useDemo } from "@/demo/demo-provider";
import { Info } from "lucide-react";
import Link from "next/link";

export default function DemoGraphPage() {
  const { getProjects, getPapers, getPaperTags } = useDemo();
  const [projects, setProjects] = useState<Array<{ id: string; name: string; paperIds?: string[] }>>([]);
  const [papers, setPapers] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    setProjects(getProjects());
    setPapers(getPapers());
  }, [getProjects, getPapers]);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Graph</h1>
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md text-orange-700 text-sm">
            <Info className="w-4 h-4" />
            <span>Demo mode: read-only</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 mb-6">
            Select a project to view its graph visualization:
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const projectPapers = papers.filter((p) =>
                project.paperIds?.includes(p.id)
              );
              const projectTags = new Set<string>();
              projectPapers.forEach((paper) => {
                getPaperTags(paper.id).forEach((tag) => {
                  projectTags.add(tag.name);
                });
              });

              return (
                <Link
                  key={project.id}
                  href={`/demo/projects/${project.id}/graph`}
                  className="block bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {project.name}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{projectPapers.length} papers</p>
                    <p>{projectTags.size} tags</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

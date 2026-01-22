"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { useDemo } from "@/demo/demo-provider";

export default function DemoDocDetailPage() {
  const params = useParams();
  const { id } = params;
  const { getDoc, getDocTags, getProject } = useDemo();
  const [doc, setDoc] = useState<{ id: string; title: string; content: string; projectId: string; updatedAt: string } | null>(null);
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);
  const [project, setProject] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (id && typeof id === "string") {
      const docData = getDoc(id);
      if (docData) {
        setDoc(docData);
        setTags(getDocTags(id));
        const projectData = getProject(docData.projectId);
        setProject(projectData);
      }
    }
  }, [id, getDoc, getDocTags, getProject]);

  if (!doc) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-500">Doc not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href={`/demo/projects/${doc.projectId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </Link>

        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {doc.title}
            </h1>
            {project && (
              <p className="text-sm text-gray-500">
                Project: {project.name}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Updated {new Date(doc.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md text-orange-700 text-sm">
            <Info className="w-4 h-4" />
            <span>Demo mode: read-only</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                  {doc.content}
                </pre>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {tags.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

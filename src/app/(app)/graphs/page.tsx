import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GraphsPage() {
  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  // Get user's project memberships
  const memberships = await db.projectMember.findMany({
    where: { userId: user.id },
    include: {
      project: {
        include: {
          _count: {
            select: {
              papers: true,
              todos: true,
            },
          },
          papers: {
            include: {
              paper: {
                include: {
                  tags: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      project: {
        updatedAt: "desc",
      },
    },
  });

  // Count unique tags across papers in each project
  const projectsWithCounts = memberships.map((membership) => {
    const project = membership.project;
    const tagSet = new Set<string>();
    project.papers.forEach((pp) => {
      pp.paper.tags.forEach((pt) => {
        tagSet.add(pt.tagId);
      });
    });
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      paperCount: project._count.papers,
      todoCount: project._count.todos,
      tagCount: tagSet.size,
    };
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Project Graphs</h1>
          <p className="text-gray-600 mt-2">
            Visualize relationships between projects, papers, and tags
          </p>
        </div>

        {projectsWithCounts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No projects found</p>
            <Button asChild>
              <Link href="/projects">Create a project</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsWithCounts.map((project) => (
              <Card key={project.id} className="bg-white">
                <CardHeader>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Papers:</span>
                      <span className="font-medium">{project.paperCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tags:</span>
                      <span className="font-medium">{project.tagCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Todos:</span>
                      <span className="font-medium">{project.todoCount}</span>
                    </div>
                  </div>
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/projects/${project.id}/graph`}>
                      Open Graph
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

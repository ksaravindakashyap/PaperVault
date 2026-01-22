"use client";

import { createContext, useContext, ReactNode } from "react";
import { demoData, DemoPaper, DemoProject, DemoDoc, DemoTodo, DemoTag, DemoCitation } from "./demo-data";

interface DemoProviderContext {
  getPapers: () => DemoPaper[];
  getPaper: (id: string) => DemoPaper | undefined;
  getProjects: () => DemoProject[];
  getProject: (id: string) => DemoProject | undefined;
  getDocs: (projectId?: string) => DemoDoc[];
  getDoc: (id: string) => DemoDoc | undefined;
  getTodos: (projectId?: string) => DemoTodo[];
  getTodo: (id: string) => DemoTodo | undefined;
  getTags: () => DemoTag[];
  getPaperTags: (paperId: string) => DemoTag[];
  getDocTags: (docId: string) => DemoTag[];
  getCitations: (paperId: string) => DemoCitation[];
  search: (query: string, types?: string[]) => Array<{
    type: "paper" | "doc" | "todo" | "citation";
    id: string;
    title: string;
    snippet?: string;
    projectId?: string;
    paperId?: string;
    url: string;
    score: number;
    tags?: string[];
  }>;
}

const DemoContext = createContext<DemoProviderContext | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const getPapers = () => demoData.papers;
  
  const getPaper = (id: string) => demoData.papers.find(p => p.id === id);
  
  const getProjects = () => demoData.projects;
  
  const getProject = (id: string) => demoData.projects.find(p => p.id === id);
  
  const getDocs = (projectId?: string) => {
    if (projectId) {
      return demoData.docs.filter(d => d.projectId === projectId);
    }
    return demoData.docs;
  };
  
  const getDoc = (id: string) => demoData.docs.find(d => d.id === id);
  
  const getTodos = (projectId?: string) => {
    if (projectId) {
      return demoData.todos.filter(t => t.projectId === projectId);
    }
    return demoData.todos;
  };
  
  const getTodo = (id: string) => demoData.todos.find(t => t.id === id);
  
  const getTags = () => demoData.tags;
  
  const getPaperTags = (paperId: string) => {
    const tagIds = demoData.paperTags
      .filter(pt => pt.paperId === paperId)
      .map(pt => pt.tagId);
    return demoData.tags.filter(t => tagIds.includes(t.id));
  };
  
  const getDocTags = (docId: string) => {
    const tagIds = demoData.docTags
      .filter(dt => dt.docId === docId)
      .map(dt => dt.tagId);
    return demoData.tags.filter(t => tagIds.includes(t.id));
  };
  
  const getCitations = (paperId: string) => {
    return demoData.citations.filter(c => c.sourcePaperId === paperId);
  };
  
  const search = (query: string, types: string[] = ["papers", "docs", "todos", "citations"]) => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];
    
    const tokens = normalizedQuery.split(/\s+/).filter(t => t.length >= 2);
    const results: Array<{
      type: "paper" | "doc" | "todo" | "citation";
      id: string;
      title: string;
      snippet?: string;
      projectId?: string;
      paperId?: string;
      url: string;
      score: number;
      tags?: string[];
    }> = [];
    
    if (types.includes("papers")) {
      demoData.papers.forEach(paper => {
        let score = 0;
        const titleMatch = paper.title.toLowerCase();
        const abstractMatch = paper.abstract?.toLowerCase() || "";
        
        tokens.forEach(token => {
          if (titleMatch.includes(token)) score += 10;
          if (abstractMatch.includes(token)) score += 3;
          if (paper.authors?.toLowerCase().includes(token)) score += 2;
        });
        
        if (score > 0) {
          const tags = getPaperTags(paper.id).map(t => t.name);
          results.push({
            type: "paper",
            id: paper.id,
            title: paper.title,
            snippet: paper.abstract?.substring(0, 120),
            url: `/demo/papers/${paper.id}`,
            score,
            tags,
          });
        }
      });
    }
    
    if (types.includes("docs")) {
      demoData.docs.forEach(doc => {
        let score = 0;
        const titleMatch = doc.title.toLowerCase();
        const contentMatch = doc.content.toLowerCase();
        
        tokens.forEach(token => {
          if (titleMatch.includes(token)) score += 10;
          if (contentMatch.includes(token)) score += 3;
        });
        
        if (score > 0) {
          const tags = getDocTags(doc.id).map(t => t.name);
          results.push({
            type: "doc",
            id: doc.id,
            title: doc.title,
            snippet: doc.content.substring(0, 120),
            projectId: doc.projectId,
            url: `/demo/docs/${doc.id}`,
            score,
            tags,
          });
        }
      });
    }
    
    if (types.includes("todos")) {
      demoData.todos.forEach(todo => {
        let score = 0;
        const titleMatch = todo.title.toLowerCase();
        const notesMatch = todo.notes?.toLowerCase() || "";
        
        tokens.forEach(token => {
          if (titleMatch.includes(token)) score += 10;
          if (notesMatch.includes(token)) score += 3;
        });
        
        if (score > 0) {
          results.push({
            type: "todo",
            id: todo.id,
            title: todo.title,
            snippet: todo.notes?.substring(0, 120),
            projectId: todo.projectId,
            url: `/demo/projects/${todo.projectId}?tab=todos`,
            score,
          });
        }
      });
    }
    
    if (types.includes("citations")) {
      demoData.citations.forEach(citation => {
        let score = 0;
        const titleMatch = citation.title?.toLowerCase() || "";
        const rawMatch = citation.raw.toLowerCase();
        
        tokens.forEach(token => {
          if (titleMatch.includes(token)) score += 10;
          if (rawMatch.includes(token)) score += 3;
        });
        
        if (score > 0) {
          results.push({
            type: "citation",
            id: citation.id,
            title: citation.title || citation.raw,
            snippet: citation.raw.substring(0, 120),
            paperId: citation.sourcePaperId,
            url: `/demo/papers/${citation.sourcePaperId}#citations`,
            score,
          });
        }
      });
    }
    
    return results.sort((a, b) => b.score - a.score).slice(0, 50);
  };
  
  const value: DemoProviderContext = {
    getPapers,
    getPaper,
    getProjects,
    getProject,
    getDocs,
    getDoc,
    getTodos,
    getTodo,
    getTags,
    getPaperTags,
    getDocTags,
    getCitations,
    search,
  };
  
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within DemoProvider");
  }
  return context;
}

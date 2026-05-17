"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Target,
  FileText,
  Sparkles,
  X,
  Check,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function AboutPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Why <span className="text-orange-500">PaperVault</span>?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A research workspace built around how researchers actually read, organize, and write.
          </p>
        </motion.div>

        {/* The Problem */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-start gap-4 mb-6">
            <Target className="w-8 h-8 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">The Problem</h2>
              <div className="prose prose-lg text-gray-700 space-y-4">
                <p>
                  Most researchers manage papers through a mix of PDFs in folders,
                  Google Docs for notes, and a messy BibTeX file. It works, until it doesn&apos;t.
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>You can&apos;t remember which papers you already read</li>
                  <li>Literature reviews take hours of manual cross-referencing</li>
                  <li>You have no idea what your library is missing</li>
                  <li>Citations and notes live in different places</li>
                </ul>
                <p>
                  PaperVault brings everything into one place and adds AI to do the
                  analytical work that currently falls on you.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Why not Notion / Zotero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Why not Notion or Zotero?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-500" />
                  Existing tools
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Notion is general-purpose, not research-first</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Zotero manages citations but not reading workflows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>None of them help you find what you are missing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>No AI assistance for synthesis or gap analysis</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  PaperVault
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span><strong>Paper is the unit.</strong> Everything is organized around it</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span><strong>Reading pipeline.</strong> Track every paper from found to integrated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span><strong>AI that helps.</strong> Synthesis, gap finding, and recommendations built in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span><strong>BibTeX ready.</strong> Citations always one click away</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* How the AI works (user-facing) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-start gap-4">
            <Sparkles className="w-8 h-8 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Where AI fits in</h2>
              <div className="prose prose-lg text-gray-700 space-y-4">
                <p>
                  PaperVault uses AI in four specific places where manual work is genuinely slow and tedious.
                </p>
                <div className="space-y-4 not-prose">
                  {[
                    {
                      title: "Search",
                      body: "Type a topic and AI figures out the best way to search, whether that is a direct title match or a broad exploration across multiple keywords and venues.",
                    },
                    {
                      title: "What to read next",
                      body: "Based on papers you have read deeply, the system surfaces the most relevant papers from your To Read queue so you always have a clear next step.",
                    },
                    {
                      title: "Synthesis",
                      body: "Select a few papers and get a paragraph describing what they agree on, where they conflict, and how their methods differ. Paste it straight into your lit review draft.",
                    },
                    {
                      title: "Gap finding",
                      body: "Describe your research direction and AI compares your library against recent literature to name specific areas you have not yet covered.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-5">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Paper model */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-start gap-4">
            <FileText className="w-8 h-8 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything lives on the paper</h2>
              <p className="text-gray-700 text-lg mb-6">
                Each paper in PaperVault carries its full context with it.
              </p>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <ul className="space-y-3 text-base text-gray-700">
                  {[
                    "Metadata: title, authors, venue, year, DOI",
                    "Abstract and summary notes",
                    "Auto-generated BibTeX",
                    "Extracted references, linked to your library where possible",
                    "Reading status: Inbox, To Read, Skimmed, Deep Read, Integrated",
                    "Project membership across multiple research threads",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-orange-500">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-orange-500 rounded-2xl p-8 md:p-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">Try it now</h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            No signup, no installation. Upload a paper and see how it works.
          </p>
          <Link href="/library">
            <Button
              size="lg"
              className="bg-white text-orange-500 hover:bg-gray-100 text-lg px-8"
            >
              Open Library
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}

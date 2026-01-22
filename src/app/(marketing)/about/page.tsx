"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Target,
  FileText,
  Settings,
  Zap,
  Network,
  MapPin,
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
            A lightweight, paper-centric workspace designed for research labs
            that need organization without the overhead.
          </p>
        </motion.div>

        {/* Why PaperVault Exists */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-start gap-4 mb-6">
            <Target className="w-8 h-8 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                The Problem
              </h2>
              <div className="prose prose-lg text-gray-700 space-y-4">
                <p>
                  Research labs rely on PDFs and Google Docs. They use email,
                  Slack, and shared folders to exchange papers. But when it
                  comes to organizing this research, the friction is real:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>Heavy tools like Notion</strong> are overkill and
                    slow for simple paper management
                  </li>
                  <li>
                    <strong>Reference managers</strong> (Zotero, Mendeley) focus
                    on citations, not lab workflows
                  </li>
                  <li>
                    <strong>File folders</strong> become chaotic without metadata
                    and linking
                  </li>
                </ul>
                <p>
                  Labs need something{" "}
                  <strong>low-friction, local-first, and paper-centric</strong>.
                  Something that respects their existing workflow but adds
                  structure.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Why PaperVault vs Notion */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Why not just use Notion?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Notion */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-500" />
                  Heavy tools (Notion, Roam)
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>General-purpose, not research-first</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Slow page loads, cloud dependency</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>No BibTeX, no citation extraction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Writing friction for LaTeX users</span>
                  </li>
                </ul>
              </div>

              {/* PaperVault */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  PaperVault
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>
                      <strong>Paper-centric entities:</strong> PDF is the atomic
                      unit
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>
                      <strong>Citation-first:</strong> BibTeX + references
                      extraction
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>
                      <strong>LaTeX-first writing:</strong> Copy BibTeX, export to
                      Overleaf
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>
                      <strong>Minimal friction:</strong> Local-first, fast,
                      deterministic
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <p className="mt-6 text-center text-gray-600 italic">
              PaperVault respects the way researchers actually work: PDFs, citations,
              and writing.
            </p>
          </div>
        </motion.section>

        {/* Paper-Centric Model */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-start gap-4 mb-6">
            <FileText className="w-8 h-8 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Paper-Centric Architecture
              </h2>
              <div className="prose prose-lg text-gray-700 space-y-4">
                <p>
                  PaperVault treats the <strong>Paper</strong> as the core
                  object. Each paper has:
                </p>
                <div className="bg-white p-6 rounded-xl border border-gray-200 my-6">
                  <ul className="space-y-3 text-base">
                    <li className="flex items-center gap-2">
                      <span className="text-orange-500">•</span>
                      <strong>PDF file</strong> (stored locally)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-orange-500">•</span>
                      <strong>Metadata</strong>: title, authors, venue, year,
                      DOI, abstract
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-orange-500">•</span>
                      <strong>BibTeX</strong>: auto-generated citation
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-orange-500">•</span>
                      <strong>References</strong>: extracted citation list
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-orange-500">•</span>
                      <strong>Summary</strong>: custom notes and takeaways
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-orange-500">•</span>
                      <strong>Status pipeline</strong>: To Read → Reading →
                      Integrated
                    </li>
                  </ul>
                </div>
                <p>
                  This model mirrors how researchers actually think: papers are
                  the atomic unit, not tags or folders. Everything flows from
                  the paper.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Conference-Aware Extraction */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-start gap-4 mb-6">
            <Settings className="w-8 h-8 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Conference-Aware Extraction
              </h2>
              <div className="prose prose-lg text-gray-700 space-y-4">
                <p>
                  Not all PDFs are created equal. A NeurIPS paper has a
                  different structure than an ACL or USENIX paper.
                </p>
                <p>
                  PaperVault uses <strong>venue-specific profiles</strong> to
                  extract metadata deterministically:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>ACL</strong>: NLP conferences (ACL, EMNLP, NAACL,
                    CoNLL)
                  </li>
                  <li>
                    <strong>NeurIPS</strong>: ML/AI conferences (NeurIPS, ICML,
                    ICLR)
                  </li>
                  <li>
                    <strong>Systems</strong>: USENIX, OSDI, SOSP, NSDI
                  </li>
                  <li>
                    <strong>Security</strong>: CCS, S&amp;P, USENIX Security
                  </li>
                  <li>
                    <strong>General CS</strong>: fallback for other venues
                  </li>
                </ul>
                <p>
                  Each profile knows where to look for titles, authors, and
                  abstracts. This makes extraction{" "}
                  <strong>reproducible and accurate</strong>.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Deterministic Pipeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-start gap-4 mb-6">
            <Zap className="w-8 h-8 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Deterministic Pipeline
              </h2>
              <div className="prose prose-lg text-gray-700 space-y-4">
                <p>
                  We deliberately chose <strong>deterministic heuristics</strong>{" "}
                  over machine learning or external APIs. Here&apos;s why:
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 my-6">
                  <ul className="space-y-3 text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold mt-1">✓</span>
                      <div>
                        <strong>Reproducible:</strong> Same input → same output,
                        every time
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold mt-1">✓</span>
                      <div>
                        <strong>Offline:</strong> No API keys, no internet, no
                        rate limits
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold mt-1">✓</span>
                      <div>
                        <strong>Fast:</strong> Process papers in seconds, not
                        minutes
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold mt-1">✓</span>
                      <div>
                        <strong>Debuggable:</strong> When extraction fails, you
                        know why
                      </div>
                    </li>
                  </ul>
                </div>
                <p>
                  For research labs that value control and transparency, this
                  approach is a feature, not a limitation.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Engineering Highlights */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-start gap-4 mb-6">
            <Network className="w-8 h-8 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Engineering Highlights
              </h2>
              <div className="prose prose-lg text-gray-700 space-y-4">
                <p>Under the hood, PaperVault is built for reliability:</p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6">
                  Worker Queue with Locks
                </h3>
                <p>
                  A background worker processes papers asynchronously. Row-level
                  locks prevent concurrent processing. Automatic retries handle
                  transient failures.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6">
                  Bounded Extraction Strategy
                </h3>
                <p>
                  PDFs are parsed with <strong>page limits</strong> (first 3
                  pages for metadata, last 10 for references). This keeps
                  extraction fast and prevents memory issues with 100+ page
                  papers.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6">
                  Safe File Handling
                </h3>
                <p>
                  Uploaded files are validated (size, type, magic bytes). Stored
                  with UUIDs to avoid collisions. Temp files are cleaned up
                  atomically.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6">
                  Citation Resolver
                </h3>
                <p>
                  References are parsed into structured citations. The resolver
                  attempts to link citations to existing papers in your library,
                  building an internal citation graph.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Roadmap */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-start gap-4 mb-6">
            <MapPin className="w-8 h-8 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Roadmap</h2>
              <p className="text-lg text-gray-600 mb-6">
                PaperVault is currently at <strong>Step 2</strong> (metadata +
                citations extraction). Here&apos;s what&apos;s next:
              </p>

              <div className="space-y-6">
                {/* Step 3 */}
                <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded">
                      Step 3
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Projects / Workspaces
                    </h3>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Collections:</strong> Organize papers by research
                        thread or topic
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Tags and filters:</strong> Multi-dimensional
                        organization
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Paper linking:</strong> Connect related papers
                        beyond citations
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Step 4 */}
                <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-r-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-gray-400 text-white text-sm font-bold rounded">
                      Step 4
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Collaboration & Sharing
                    </h3>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">○</span>
                      <span>
                        <strong>Shared workspaces:</strong> Invite lab members to
                        projects
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">○</span>
                      <span>
                        <strong>Collaborative notes:</strong> Google-doc-like
                        real-time editing
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">○</span>
                      <span>
                        <strong>Comments and audit:</strong> Track contributions
                        and discussions
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Step 5 */}
                <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-r-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-gray-400 text-white text-sm font-bold rounded">
                      Step 5
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Graph Visualization
                    </h3>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">○</span>
                      <span>
                        <strong>Concept graphs:</strong> Visualize research
                        clusters and themes
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">○</span>
                      <span>
                        <strong>Citation networks:</strong> See how papers connect
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">○</span>
                      <span>
                        <strong>Venue clustering:</strong> Group by conference,
                        year, or topic
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Step 6 */}
                <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-r-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-gray-400 text-white text-sm font-bold rounded">
                      Step 6
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Manuscript Export
                    </h3>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">○</span>
                      <span>
                        <strong>Overleaf integration:</strong> Export collections
                        to LaTeX projects
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">○</span>
                      <span>
                        <strong>Bibliography generation:</strong> Auto-generate
                        .bib files
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">○</span>
                      <span>
                        <strong>Research → Writing:</strong> Turn organized papers
                        into manuscripts
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <p className="mt-8 text-gray-600 italic">
                The goal remains the same: <strong>simple, fast, local</strong>.
                No cloud sync, no AI hype, no vendor lock-in.
              </p>
            </div>
          </div>
        </motion.section>

        {/* CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-orange-500 rounded-2xl p-8 md:p-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">Try it now</h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            No signup, no installation. Just upload a paper and see how it works.
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

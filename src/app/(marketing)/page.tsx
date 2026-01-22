"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Code,
  List,
  FolderOpen,
  ArrowRight,
  CheckCircle2,
  Mail,
  Linkedin,
  Github,
  Copy,
  Check,
  Edit3,
  Network,
  FileOutput,
  Users,
  MessageSquare,
  GitBranch,
} from "lucide-react";
import { useState } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("aravinda.kashyap@example.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="text-center lg:text-left"
            >
              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight"
              >
                PaperVault — Research-native{" "}
                <span className="text-orange-500">paper workspace</span>
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="mt-6 text-xl text-gray-600 max-w-2xl"
              >
                Upload PDFs, extract metadata + BibTeX, track reading status, and
                build project libraries that turn papers into writing.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link href="/download">
                  <Button
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8"
                  >
                    Download Software
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/demo/library">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 border-gray-300"
                  >
                    View Demo
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: Mock Cards */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="hidden lg:grid gap-4"
            >
              <motion.div
                variants={fadeInUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 text-orange-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Metadata Card</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Conference-aware extraction
                    </p>
                    <div className="mt-3 space-y-1 text-xs text-gray-500">
                      <div>Title • Authors • Venue</div>
                      <div>Year • DOI • Abstract</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <Code className="w-6 h-6 text-orange-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">BibTeX</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Copy-ready citations
                    </p>
                    <pre className="mt-3 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                      @inproceedings{"{"}...{"}"}
                    </pre>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <List className="w-6 h-6 text-orange-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">References</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Extracted citations table
                    </p>
                    <div className="mt-3 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>15 references found</span>
                        <CheckCircle2 className="w-4 h-4 text-orange-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-8 text-center"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-orange-500" />
              <span className="text-gray-700 font-medium">Local-first</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-orange-500" />
              <span className="text-gray-700 font-medium">
                Deterministic extraction
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-orange-500" />
              <span className="text-gray-700 font-medium">No heavy tools</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900">
              Everything you need for paper management
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Built for research labs that value simplicity and control
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: "Paper-centric Library",
                description:
                  "PDF + venue-aware metadata. Track reading status from upload to integrated.",
              },
              {
                icon: Edit3,
                title: "Research Notes",
                description:
                  "Summary space per paper. Capture insights and takeaways as you read.",
              },
              {
                icon: Code,
                title: "BibTeX Ready",
                description:
                  "Copy/export citations. Automatic BibTeX formatting for LaTeX papers.",
              },
              {
                icon: List,
                title: "References Extraction",
                description:
                  "Per-paper references list. Links to papers already in your library.",
              },
              {
                icon: FolderOpen,
                title: "Projects / Workspaces",
                description:
                  "Group papers by research thread. Organize your reading around projects.",
                badge: "Step 3",
              },
              {
                icon: Network,
                title: "Graph + Manuscript",
                description:
                  "Concept graph clustering. Overleaf export for turning research into writing.",
                badge: "Planned",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative"
              >
                {"badge" in feature && (
                  <span className="absolute top-4 right-4 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                    {feature.badge}
                  </span>
                )}
                <feature.icon className="w-12 h-12 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Desktop Software Coming Soon */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-8 md:p-12"
          >
            <div className="flex items-start gap-4 mb-6">
              <svg
                className="w-10 h-10 text-orange-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Desktop software coming soon
                  </h2>
                  <span className="px-3 py-1 bg-orange-200 text-orange-800 text-sm font-semibold rounded-full">
                    In Development
                  </span>
                </div>
                <p className="text-lg text-gray-700 mb-6">
                  A native desktop application for Windows, macOS, and Linux with enhanced local-first capabilities.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">
                        Local-first architecture
                      </span>
                      <p className="text-gray-600 text-sm">
                        Full offline support — your data stays on your machine
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">
                        Built-in PDF viewer
                      </span>
                      <p className="text-gray-600 text-sm">
                        Read and annotate papers directly within the app
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">
                        Enhanced performance
                      </span>
                      <p className="text-gray-600 text-sm">
                        Faster processing and search with native system integration
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900">How it works</h2>
            <p className="mt-4 text-xl text-gray-600">
              Three simple steps to organized research
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Upload PDF",
                description:
                  "Upload your paper and select the conference venue type for specialized parsing.",
              },
              {
                step: "2",
                title: "Extract metadata + BibTeX",
                description:
                  "Worker pipeline extracts title, authors, abstract, BibTeX, and references automatically.",
              },
              {
                step: "3",
                title: "Organize into projects + write notes",
                description:
                  "Add research summaries, organize papers into project workspaces, and build towards writing.",
              },
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 text-white text-2xl font-bold rounded-full mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900">Get in touch</h2>
            <p className="mt-4 text-xl text-gray-600">
              Questions or feedback? Reach out anytime
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-12 rounded-2xl border border-gray-200 shadow-lg"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  K S Aravinda Kashyap
                </h3>
                <p className="text-gray-600 mt-1">
                  Full-stack Engineer & Research Tool Builder
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-700">
                    aravinda.kashyap@example.com
                  </span>
                  <button
                    onClick={handleCopyEmail}
                    className="ml-auto px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-2 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <a
                  href="https://linkedin.com/in/ksaravindakashyap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-700 hover:text-orange-500 transition-colors"
                >
                  <Linkedin className="w-5 h-5 text-orange-500" />
                  linkedin.com/in/ksaravindakashyap
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-orange-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to organize your research?
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              Try the demo or download the desktop app
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/download">
                <Button
                  size="lg"
                  className="bg-white text-orange-500 hover:bg-gray-100 text-lg px-8"
                >
                  Download Software
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/demo/library">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white/10 text-lg px-8"
                >
                  View Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Search,
  Columns3,
  Sparkles,
  Telescope,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Linkedin,
  Network,
} from "lucide-react";
import { MARKETING_DEMO_HREF } from "@/lib/marketing-demo-href";

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
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
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
                The research workspace that{" "}
                <span className="text-orange-500">thinks with you</span>
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="mt-6 text-xl text-gray-600 max-w-2xl"
              >
                Upload PDFs, discover papers with AI search, track your reading
                pipeline, and let AI find gaps in your literature coverage.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link href="/library">
                  <Button
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href={MARKETING_DEMO_HREF}>
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

            {/* Mock cards */}
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
                  <Search className="w-6 h-6 text-orange-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Search</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      100M+ papers, smart query detection
                    </p>
                    <div className="mt-3 text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Paper Lookup</span>
                        <span>exact title match</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Topic Search</span>
                        <span>LLM decomposition</span>
                      </div>
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
                  <Columns3 className="w-6 h-6 text-orange-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Reading Queue</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Kanban board for your reading pipeline
                    </p>
                    <div className="mt-3 flex gap-1 text-xs">
                      {["Inbox", "To Read", "Skimmed", "Deep Read", "Integrated"].map((s) => (
                        <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{s}</span>
                      ))}
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
                  <Telescope className="w-6 h-6 text-orange-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Research Gap Finder</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      AI maps what your library is missing
                    </p>
                    <div className="mt-3 text-xs text-gray-500">
                      3 to 4 named gaps with suggested papers
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-8 text-center"
          >
            {[
              "AI-powered discovery",
              "Semantic recommendations",
              "No configuration needed",
              "Built for researchers",
            ].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span className="text-gray-700 font-medium">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900">
              Built for the full research workflow
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              From discovery to literature review, in one workspace
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "AI Search",
                description:
                  "Search 100M+ papers with natural language. AI automatically decides whether to do a fast title lookup or a deep topic search based on how you phrase your query.",
              },
              {
                icon: Columns3,
                title: "Reading Queue",
                description:
                  "Kanban board tracking papers from Inbox through Integrated. Move papers forward with one click and see your entire reading pipeline at a glance.",
              },
              {
                icon: Lightbulb,
                title: "What to Read Next",
                description:
                  "Personalized recommendations based on what you have already read deeply. Surfaces the most relevant papers from your To Read queue so you always know where to start.",
              },
              {
                icon: Sparkles,
                title: "Cross-paper Synthesis",
                description:
                  "Select 2 to 5 papers and generate a synthesis paragraph covering shared findings, contradictions, and methodological differences. Paste-ready for your lit review.",
              },
              {
                icon: Telescope,
                title: "Research Gap Finder",
                description:
                  "Describe your research direction. AI compares your library against recent literature and surfaces 3 to 4 named gaps with specific papers to fill them.",
              },
              {
                icon: FileText,
                title: "Paper Library",
                description:
                  "Upload PDFs with automatic metadata extraction, BibTeX generation, and reference linking. Everything organized in a searchable, filterable library.",
              },
              {
                icon: Network,
                title: "Citation Graph",
                description:
                  "Visual graph of paper relationships within a project. See how your papers connect through citations and shared topics.",
              },
              {
                icon: FileText,
                title: "Projects and Docs",
                description:
                  "Group papers into research projects. Write notes, attach docs to papers, and collaborate with role-based access and audit trails.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.08 }}
                className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <feature.icon className="w-10 h-10 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
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
              From first paper to finished literature review
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Build your library",
                description:
                  "Upload PDFs or discover papers through AI Search. Metadata, BibTeX, and citations are extracted automatically.",
              },
              {
                step: "2",
                title: "Track your reading",
                description:
                  "Use the Reading Queue board to move papers from Inbox through To Read, Skimmed, Deep Read, and Integrated.",
              },
              {
                step: "3",
                title: "Get AI guidance",
                description:
                  "Let the system recommend what to read next, find gaps in your coverage, and synthesize groups of papers.",
              },
              {
                step: "4",
                title: "Write with confidence",
                description:
                  "Copy synthesis paragraphs, export BibTeX, and pull from organized notes attached to each paper.",
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

      {/* Contact */}
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
              Questions or feedback? Reach out anytime.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-12 rounded-2xl border border-gray-200 shadow-lg"
          >
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">
                K S Aravinda Kashyap
              </h3>

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
              Start in your browser, no download needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/library">
                <Button
                  size="lg"
                  className="bg-white text-orange-500 hover:bg-gray-100 text-lg px-8"
                >
                  Start Using PaperVault
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href={MARKETING_DEMO_HREF}>
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

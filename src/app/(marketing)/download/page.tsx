"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FileText,
  Database,
  Lock,
  Zap,
  Search,
  Network,
  CheckCircle2,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function GetStartedPage() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 text-white rounded-full mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Get Started with PaperVault
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Full-featured web application - no download required
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
              Start organizing your research papers, extracting metadata, and collaborating with your team right now in your browser.
            </p>
            <Link href="/library">
              <Button
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8"
              >
                Launch PaperVault
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* What You Can Do Right Now */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What you can do right now
            </h2>
            <p className="text-xl text-gray-600">
              All features available immediately in your browser
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: "Upload & Process PDFs",
                description:
                  "Upload research papers and automatically extract metadata, title, authors, abstract, and BibTeX citations.",
              },
              {
                icon: Zap,
                title: "Metadata Extraction",
                description:
                  "Conference-aware parsing for NEURIPS, ACL, USENIX, and more. Get clean, structured data from your papers.",
              },
              {
                icon: Database,
                title: "Projects & Collaboration",
                description:
                  "Organize papers into projects, invite team members, manage permissions, and collaborate with shared docs.",
              },
              {
                icon: Search,
                title: "AI Search and Gap Finder",
                description:
                  "Search 100M+ papers with natural language. Discover what your library is missing with the Research Gap Finder.",
              },
              {
                icon: Network,
                title: "Citation Graph",
                description:
                  "Visualize paper relationships, track citations, and explore your research network with interactive graphs.",
              },
              {
                icon: Lock,
                title: "Secure Workspaces",
                description:
                  "Role-based access control, workspace management, and audit trails for team governance.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
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

      {/* Quick Start Guide */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Three steps to get started
            </h2>
            <p className="text-xl text-gray-600">
              Begin organizing your research in minutes
            </p>
          </motion.div>

          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Create your workspace",
                description:
                  "Click 'Launch PaperVault' and you'll automatically be set up with a workspace. No registration required to start.",
              },
              {
                step: "2",
                title: "Upload your first paper",
                description:
                  "Upload a PDF, select the conference venue type, and let PaperVault extract all the metadata automatically.",
              },
              {
                step: "3",
                title: "Start organizing",
                description:
                  "Create projects, add papers to reading queues, take notes, and use AI search to discover related work.",
              },
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="flex items-start gap-6 bg-white p-6 rounded-xl border border-gray-200"
              >
                <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 bg-orange-500 text-white text-xl font-bold rounded-full">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-orange-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              Launch PaperVault now and start organizing your research
            </p>
            <Link href="/library">
              <Button
                size="lg"
                className="bg-white text-orange-500 hover:bg-gray-100 text-lg px-8"
              >
                Launch PaperVault
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

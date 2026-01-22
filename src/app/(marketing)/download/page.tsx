"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Download,
  ArrowRight,
  FileText,
  Database,
  Lock,
  Zap,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function DownloadPage() {
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
              <Download className="w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              PaperVault Desktop
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Coming soon
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
              Download the full desktop application for local-first paper management with complete control over your research data.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What desktop enables
            </h2>
            <p className="text-xl text-gray-600">
              Full-featured research workspace on your machine
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: "Local PDFs + Full Ingestion",
                description:
                  "Upload and process PDFs directly on your machine with the complete extraction pipeline.",
              },
              {
                icon: Zap,
                title: "Deterministic Extraction",
                description:
                  "Consistent metadata extraction, BibTeX generation, and citation parsing with full control.",
              },
              {
                icon: Database,
                title: "Projects & Collaboration",
                description:
                  "Organize papers into projects, create docs, manage todos, and collaborate with your team.",
              },
              {
                icon: FileText,
                title: "Search & Graph",
                description:
                  "Global search across all your papers, docs, and todos. Visualize relationships with graph view.",
              },
              {
                icon: Lock,
                title: "Private & Offline-First",
                description:
                  "All your data stays on your machine. Work offline, sync when you choose.",
              },
              {
                icon: ArrowRight,
                title: "Complete Feature Set",
                description:
                  "Tags, citations, notes, summaries, and everything you need for research management.",
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
              Join the waitlist to be notified when PaperVault Desktop is available
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:ksaravindakashyap@gmail.com?subject=PaperVault Desktop Waitlist"
                className="inline-block"
              >
                <Button
                  size="lg"
                  className="bg-white text-orange-500 hover:bg-gray-100 text-lg px-8"
                >
                  Join Waitlist
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <Link href="/demo/library">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white/10 text-lg px-8"
                >
                  Try Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
